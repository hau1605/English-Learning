import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { Logger } from "@nestjs/common";
import { AuthService } from "@/modules/auth/services/auth.service";

const WS_ALLOWED =
  process.env.WS_ALLOWED_ORIGINS || process.env.FRONTEND_URL || "";
const WS_ALLOWED_LIST = WS_ALLOWED.split(",")
  .map((s) => s.trim())
  .filter(Boolean);

@WebSocketGateway({
  cors: {
    origin: WS_ALLOWED_LIST.length > 0 ? WS_ALLOWED_LIST : "*",
  },
  namespace: "/ws",
})
export class AppGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(AppGateway.name);
  private userSockets: Map<string, Set<string>> = new Map();
  private typingUsers: Map<string, Map<string, NodeJS.Timeout>> = new Map();
  private ipConnections: Map<string, { count: number; resetAt: number }> =
    new Map();
  private readonly maxConnectionsPerIp = Number(
    process.env.WS_MAX_CONN_PER_IP || 10,
  );
  private readonly connWindowMs = Number(
    process.env.WS_CONN_WINDOW_MS || 60_000,
  );

  constructor(private readonly authService: AuthService) {}

  async handleConnection(client: Socket) {
    try {
      // origin check
      const origin = client.handshake.headers.origin as string | undefined;
      if (
        WS_ALLOWED_LIST.length > 0 &&
        origin &&
        !WS_ALLOWED_LIST.includes(origin)
      ) {
        this.logger.warn(`Rejecting connection from origin: ${origin}`);
        client.disconnect();
        return;
      }

      // simple rate limit per IP
      const remoteIp = (client.handshake.address ||
        (client.handshake.headers["x-forwarded-for"] as string) ||
        client.conn.remoteAddress ||
        "unknown") as string;
      const now = Date.now();
      const info = this.ipConnections.get(remoteIp) || {
        count: 0,
        resetAt: now + this.connWindowMs,
      };
      if (now > info.resetAt) {
        info.count = 0;
        info.resetAt = now + this.connWindowMs;
      }
      info.count += 1;
      this.ipConnections.set(remoteIp, info);
      if (info.count > this.maxConnectionsPerIp) {
        this.logger.warn(`IP ${remoteIp} exceeded websocket connection limit`);
        client.disconnect();
        return;
      }

      const token = this.extractToken(client);
      if (!token) {
        this.logger.warn(`Client ${client.id} connected without token`);
        client.disconnect();
        return;
      }

      const payload = await this.authService.verifyAccessToken(token);
      const session = await this.authService.validateSession(payload.sessionId);

      if (!session) {
        this.logger.warn(`Client ${client.id} has invalid session`);
        client.disconnect();
        return;
      }

      client.data.userId = payload.sub;
      client.data.sessionId = payload.sessionId;

      // Track user sockets
      if (!this.userSockets.has(payload.sub)) {
        this.userSockets.set(payload.sub, new Set());
      }
      this.userSockets.get(payload.sub)!.add(client.id);

      this.logger.log(`Client connected: ${client.id}, user: ${payload.sub}`);

      client.join(`user:${payload.sub}`);

      // Notify user count update
      this.broadcastOnlineUsers();

      client.emit("connected", {
        message: "Connected successfully",
        sessionId: payload.sessionId,
        userId: payload.sub,
      });
    } catch (error) {
      this.logger.error(`Connection error: ${error.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data.userId;

    if (userId && this.userSockets.has(userId)) {
      this.userSockets.get(userId)!.delete(client.id);
      if (this.userSockets.get(userId)!.size === 0) {
        this.userSockets.delete(userId);
      }
    }

    this.logger.log(`Client disconnected: ${client.id}`);
    this.broadcastOnlineUsers();
  }

  @SubscribeMessage("join:room")
  handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string },
  ) {
    client.join(`room:${data.roomId}`);
    this.logger.log(`Client ${client.id} joined room: ${data.roomId}`);
    return { event: "joined", data: { roomId: data.roomId } };
  }

  @SubscribeMessage("leave:room")
  handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string },
  ) {
    client.leave(`room:${data.roomId}`);
    this.logger.log(`Client ${client.id} left room: ${data.roomId}`);
    return { event: "left", data: { roomId: data.roomId } };
  }

  @SubscribeMessage("typing:start")
  handleTypingStart(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; type: string },
  ) {
    const userId = client.data.userId;
    if (!userId) return;

    // Set typing timeout
    const roomTyping = this.typingUsers.get(data.roomId) || new Map();
    if (roomTyping.has(userId)) {
      clearTimeout(roomTyping.get(userId)!);
    }

    const timeout = setTimeout(() => {
      this.handleTypingStop(client, { roomId: data.roomId, type: data.type });
    }, 3000);

    roomTyping.set(userId, timeout);
    this.typingUsers.set(data.roomId, roomTyping);

    // Broadcast typing to room
    this.server.to(`room:${data.roomId}`).emit("user:typing", {
      userId,
      type: data.type,
      isTyping: true,
    });
  }

  @SubscribeMessage("typing:stop")
  handleTypingStop(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; type: string },
  ) {
    const userId = client.data.userId;
    if (!userId) return;

    const roomTyping = this.typingUsers.get(data.roomId);
    if (roomTyping && roomTyping.has(userId)) {
      clearTimeout(roomTyping.get(userId)!);
      roomTyping.delete(userId);
    }

    // Broadcast stopped typing
    this.server.to(`room:${data.roomId}`).emit("user:typing", {
      userId,
      type: data.type,
      isTyping: false,
    });
  }

  @SubscribeMessage("chat:message")
  handleChatMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; message: string; type?: string },
  ) {
    const userId = client.data.userId;
    if (!userId) return;

    // Stop typing indicator
    this.handleTypingStop(client, {
      roomId: data.roomId,
      type: data.type || "chat",
    });

    // Broadcast message to room
    this.server.to(`room:${data.roomId}`).emit("chat:message", {
      userId,
      message: data.message,
      type: data.type,
      timestamp: new Date().toISOString(),
    });
  }

  // ========== EMIT METHODS ==========

  emitToUser(userId: string, event: string, data: any) {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  emitToRoom(roomId: string, event: string, data: any) {
    this.server.to(`room:${roomId}`).emit(event, data);
  }

  emitLeaderboardUpdate(data: any) {
    this.server.emit("leaderboard:update", data);
  }

  emitNotification(userId: string, notification: any) {
    this.emitToUser(userId, "notification", notification);
  }

  emitXpUpdate(userId: string, xp: number, source: string) {
    this.emitToUser(userId, "xp:update", { xp, source });
  }

  emitStreakUpdate(userId: string, streakDays: number) {
    this.emitToUser(userId, "streak:update", { streakDays });
  }

  emitAchievementUnlocked(userId: string, achievement: any) {
    this.emitToUser(userId, "achievement:unlocked", achievement);
  }

  emitQuizResult(userId: string, result: any) {
    this.emitToUser(userId, "quiz:result", result);
  }

  emitSpeakingResult(userId: string, result: any) {
    this.emitToUser(userId, "speaking:result", result);
  }

  emitLessonCompleted(userId: string, lessonId: string) {
    this.emitToUser(userId, "lesson:completed", { lessonId });
  }

  // ========== HELPER METHODS ==========

  private broadcastOnlineUsers() {
    this.server.emit("users:online", {
      count: this.userSockets.size,
    });
  }

  getOnlineUserCount(): number {
    return this.userSockets.size;
  }

  isUserOnline(userId: string): boolean {
    return this.userSockets.has(userId);
  }

  private extractToken(client: Socket): string | null {
    const authHeader = client.handshake.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      return authHeader.substring(7);
    }

    const token = client.handshake.auth?.token;
    if (token) {
      return token;
    }

    return null;
  }
}
