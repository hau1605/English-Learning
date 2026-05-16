import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EventName } from '@/common/enums';

export interface DomainEvent {
  userId: string;
  payload: Record<string, any>;
  metadata?: Record<string, any>;
}

@Injectable()
export class EventService {
  private readonly logger = new Logger(EventService.name);

  constructor(private readonly eventEmitter: EventEmitter2) {}

  emitXpUpdated(userId: string, xp: number, source: string) {
    this.eventEmitter.emit(EventName.XP_EARNED, {
      userId,
      xp,
      source,
    });
    this.logger.debug(`Emitted xp.updated for user ${userId}: ${xp} XP from ${source}`);
  }

  emitStreakUpdated(userId: string, streakDays: number) {
    this.eventEmitter.emit(EventName.STREAK_UPDATED, {
      userId,
      streakDays,
    });
    this.logger.debug(`Emitted streak.updated for user ${userId}: ${streakDays} days`);
  }

  emitFlashcardReviewed(userId: string, flashcardId: string, rating: number, xpEarned: number) {
    this.eventEmitter.emit(EventName.FLASHCARD_REVIEWED, {
      userId,
      flashcardId,
      rating,
      xpEarned,
    });
    this.logger.debug(`Emitted flashcard.reviewed for user ${userId}`);
  }

  emitQuizCompleted(userId: string, quizId: string, score: number, xpEarned: number) {
    this.eventEmitter.emit(EventName.QUIZ_COMPLETED, {
      userId,
      quizId,
      score,
      xpEarned,
    });
    this.logger.debug(`Emitted quiz.completed for user ${userId}`);
  }

  emitSpeakingCompleted(userId: string, attemptId: string, score: number, xpEarned: number) {
    this.eventEmitter.emit(EventName.SPEAKING_COMPLETED, {
      userId,
      attemptId,
      score,
      xpEarned,
    });
    this.logger.debug(`Emitted speaking.completed for user ${userId}`);
  }

  emitLessonStarted(userId: string, lessonId: string) {
    this.eventEmitter.emit(EventName.LESSON_STARTED, {
      userId,
      lessonId,
    });
    this.logger.debug(`Emitted lesson.started for user ${userId}`);
  }

  emitLessonCompleted(userId: string, lessonId: string) {
    this.eventEmitter.emit(EventName.LESSON_COMPLETED, {
      userId,
      lessonId,
    });
    this.logger.debug(`Emitted lesson.completed for user ${userId}`);
  }

  emitUserRegistered(userId: string, email: string) {
    this.eventEmitter.emit(EventName.USER_REGISTERED, {
      userId,
      email,
    });
    this.logger.debug(`Emitted user.registered for user ${userId}`);
  }

  emitUserLoggedIn(userId: string, method: string) {
    this.eventEmitter.emit(EventName.USER_LOGGED_IN, {
      userId,
      method,
    });
  }
}
