import { io, Socket } from 'socket.io-client';

type ServerToClientEvents = {
  connected: (data: { message: string; sessionId: string; userId: string }) => void;
  notification: (data: {
    id: string;
    type: string;
    title: string;
    message: string;
  }) => void;
  'leaderboard:update': (data: {
    userId: string;
    xp: number;
    rank: number;
  }) => void;
  'quiz:invite': (data: {
    quizId: string;
    fromUser: { id: string; fullName: string };
  }) => void;
  'quiz:result': (data: {
    quizId: string;
    score: number;
    xpEarned: number;
  }) => void;
  'speaking:result': (data: {
    attemptId: string;
    score: number;
    xpEarned: number;
  }) => void;
  'xp:update': (data: { xp: number; source: string }) => void;
  'streak:update': (data: { streakDays: number }) => void;
  'achievement:unlocked': (data: {
    id: string;
    name: string;
    icon: string;
    xpReward: number;
  }) => void;
  'user:typing': (data: {
    userId: string;
    type: string;
    isTyping: boolean;
  }) => void;
  'users:online': (data: { count: number }) => void;
  'lesson:completed': (data: { lessonId: string }) => void;
  'chat:message': (data: {
    userId: string;
    message: string;
    type?: string;
    timestamp: string;
  }) => void;
};

type ClientToServerEvents = {
  'join:room': (data: { roomId: string }) => void;
  'leave:room': (data: { roomId: string }) => void;
  'typing:start': (data: { roomId: string; type: string }) => void;
  'typing:stop': (data: { roomId: string; type: string }) => void;
  'chat:message': (data: { roomId: string; message: string; type?: string }) => void;
};

export type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socket: AppSocket | null = null;

export function getSocket(accessToken?: string): AppSocket {
  if (!socket) {
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000';

    socket = io(`${socketUrl}/ws`, {
      auth: accessToken ? { token: accessToken } : {},
      extraHeaders: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    socket.on('connect', () => {
      console.log('Socket connected:', socket?.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
    });
  }

  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function updateSocketAuth(accessToken: string): void {
  if (socket) {
    socket.auth = { token: accessToken };
    socket.io.opts.extraHeaders = { Authorization: `Bearer ${accessToken}` };
    if (!socket.connected) {
      socket.connect();
    }
  }
}
