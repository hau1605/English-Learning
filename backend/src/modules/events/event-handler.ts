import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AppGateway } from '@/websocket/gateways/app.gateway';
import { NotificationsService } from '@/modules/notifications/services/notifications.service';
import { QueueService } from '@/queues/queue.service';
import { EmailService } from '@/modules/email/services/email.service';
import { UsersService } from '@/modules/users/services/users.service';

@Injectable()
export class EventHandler {
  constructor(
    private readonly appGateway: AppGateway,
    private readonly notificationsService: NotificationsService,
    private readonly queueService: QueueService,
    private readonly emailService: EmailService,
    private readonly usersService: UsersService,
  ) {}

  // ========== XP & STREAK EVENTS ==========

  @OnEvent('xp.earned')
  async handleXpEarned(payload: { userId: string; xp: number; source: string }) {
    // Emit to user via WebSocket
    this.appGateway.emitToUser(payload.userId, 'xp:update', {
      xp: payload.xp,
      source: payload.source,
    });
  }

  @OnEvent('streak.updated')
  async handleStreakUpdated(payload: { userId: string; streakDays: number }) {
    // Emit to user via WebSocket
    this.appGateway.emitToUser(payload.userId, 'streak:update', {
      streakDays: payload.streakDays,
    });

    // Send notification for streak milestones (7, 14, 21, 30, etc.)
    if (payload.streakDays > 0 && payload.streakDays % 7 === 0) {
      await this.notificationsService.create({
        userId: payload.userId,
        type: 'STREAK' as any,
        title: 'Streak Milestone!',
        message: `Congratulations! You've maintained a ${payload.streakDays}-day learning streak!`,
      });
    }
  }

  // ========== LEADERBOARD EVENTS ==========

  @OnEvent('leaderboard.updated')
  async handleLeaderboardUpdated(payload: { rankings: any[] }) {
    // Broadcast to all connected clients
    this.appGateway.emitLeaderboardUpdate(payload.rankings);
  }

  // ========== QUIZ EVENTS ==========

  @OnEvent('quiz.completed')
  async handleQuizCompleted(payload: { userId: string; quizId: string; score: number; xpEarned: number }) {
    // Emit result via WebSocket
    this.appGateway.emitToUser(payload.userId, 'quiz:result', {
      quizId: payload.quizId,
      score: payload.score,
      xpEarned: payload.xpEarned,
    });

    // Queue notification for quiz completion
    await this.queueService.addNotificationJob(payload.userId, {
      type: 'QUIZ_COMPLETED',
      title: 'Quiz Completed!',
      message: `You scored ${payload.score}% and earned ${payload.xpEarned} XP!`,
    });
  }

  // ========== FLASHCARD EVENTS ==========

  @OnEvent('flashcard.reviewed')
  async handleFlashcardReviewed(payload: { userId: string; flashcardId: string; rating: number; xpEarned: number }) {
    // Emit XP update
    if (payload.xpEarned > 0) {
      this.appGateway.emitToUser(payload.userId, 'xp:earned', {
        amount: payload.xpEarned,
        source: 'flashcard_review',
      });
    }
  }

  // ========== SPEAKING EVENTS ==========

  @OnEvent('speaking.completed')
  async handleSpeakingCompleted(payload: { userId: string; attemptId: string; score: number; xpEarned: number }) {
    // Emit result via WebSocket
    this.appGateway.emitToUser(payload.userId, 'speaking:result', {
      attemptId: payload.attemptId,
      score: payload.score,
      xpEarned: payload.xpEarned,
    });

    // Queue notification
    await this.queueService.addNotificationJob(payload.userId, {
      type: 'SPEAKING_COMPLETED',
      title: 'Speaking Practice Completed!',
      message: `Your score: ${payload.score}%. You earned ${payload.xpEarned} XP!`,
    });
  }

  // ========== LESSON EVENTS ==========

  @OnEvent('lesson.started')
  async handleLessonStarted(payload: { userId: string; lessonId: string }) {
    // Track analytics - handled by analytics service
  }

  @OnEvent('lesson.completed')
  async handleLessonCompleted(payload: { userId: string; lessonId: string }) {
    // Emit to user
    this.appGateway.emitToUser(payload.userId, 'lesson:completed', {
      lessonId: payload.lessonId,
    });

    // Queue notification
    await this.queueService.addNotificationJob(payload.userId, {
      type: 'LESSON_COMPLETED',
      title: 'Lesson Completed!',
      message: 'Great job! You completed another lesson.',
    });
  }

  // ========== USER EVENTS ==========

  @OnEvent('user.registered')
  async handleUserRegistered(payload: { userId: string; email: string }) {
    // Send welcome email
    const user = await this.usersService.findById(payload.userId);
    if (user) {
      await this.emailService.sendWelcomeEmail({
        email: payload.email,
        name: user.fullName,
        verificationUrl: undefined,
      });
    }
  }

  @OnEvent('user.logged_in')
  async handleUserLoggedIn(payload: { userId: string; method: string }) {
    // Could track analytics here
  }
}
