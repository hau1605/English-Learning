import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AppGateway } from '@/websocket/gateways/app.gateway';
import { NotificationsService } from '@/modules/notifications/services/notifications.service';

@Injectable()
export class EventListener {
  private readonly logger = new Logger(EventListener.name);

  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly appGateway: AppGateway,
    private readonly notificationsService: NotificationsService,
  ) {}

  @OnEvent('xp.updated')
  async handleXpUpdated(payload: any) {
    this.logger.log(`XP updated for user ${payload.userId}: ${payload.xp}`);

    // Emit to user via WebSocket
    this.appGateway.emitToUser(payload.userId, 'xp:update', {
      xp: payload.xp,
      source: payload.source,
    });
  }

  @OnEvent('streak.updated')
  async handleStreakUpdated(payload: any) {
    this.logger.log(
      `Streak updated for user ${payload.userId}: ${payload.streakDays} days`,
    );

    // Emit to user via WebSocket
    this.appGateway.emitToUser(payload.userId, 'streak:update', {
      streakDays: payload.streakDays,
    });

    // Send notification for streak milestones
    if (payload.streakDays % 7 === 0 && payload.streakDays > 0) {
      await this.notificationsService.create({
        userId: payload.userId,
        type: 'STREAK' as any,
        title: '🔥 Streak Milestone!',
        message: `Congratulations! You've maintained a ${payload.streakDays}-day learning streak!`,
      });
    }
  }

  @OnEvent('leaderboard.updated')
  async handleLeaderboardUpdated(payload: any) {
    this.logger.log('Leaderboard updated');

    // Broadcast to all connected clients
    this.appGateway.emitLeaderboardUpdate(payload.rankings);
  }

  @OnEvent('quiz.completed')
  async handleQuizCompleted(payload: any) {
    this.logger.log(`Quiz completed for user ${payload.userId}`);

    // Emit result via WebSocket
    this.appGateway.emitToUser(payload.userId, 'quiz:result', {
      quizId: payload.quizId,
      score: payload.score,
      xpEarned: payload.xpEarned,
    });
  }

  @OnEvent('speaking.completed')
  async handleSpeakingCompleted(payload: any) {
    this.logger.log(`Speaking attempt completed for user ${payload.userId}`);

    // Emit result via WebSocket
    this.appGateway.emitToUser(payload.userId, 'speaking:result', {
      attemptId: payload.attemptId,
      score: payload.score,
      xpEarned: payload.xpEarned,
    });
  }

  @OnEvent('flashcard.reviewed')
  async handleFlashcardReviewed(payload: any) {
    this.logger.log(`Flashcard reviewed for user ${payload.userId}`);
  }

  @OnEvent('notification.created')
  async handleNotificationCreated(payload: any) {
    // Emit notification to user via WebSocket
    this.appGateway.emitToUser(payload.userId, 'notification', {
      id: payload.notificationId,
      type: payload.type,
      title: payload.title,
      message: payload.message,
    });
  }
}
