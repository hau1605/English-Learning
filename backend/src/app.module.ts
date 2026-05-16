import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { ThrottlerModule } from "@nestjs/throttler";
import { BullModule } from "@nestjs/bullmq";
import { PrismaModule } from "@/prisma/prisma.module";
import { AuthModule } from "@/modules/auth/auth.module";
import { UsersModule } from "@/modules/users/users.module";
import { PermissionsModule } from "@/modules/permissions/permissions.module";
import { VocabularyModule } from "@/modules/vocabulary/vocabulary.module";
import { FlashcardsModule } from "@/modules/flashcards/flashcards.module";
import { QuizModule } from "@/modules/quiz/quiz.module";
import { GrammarModule } from "@/modules/grammar/grammar.module";
import { SpeakingModule } from "@/modules/speaking/speaking.module";
import { AnalyticsModule } from "@/modules/analytics/analytics.module";
import { NotificationsModule } from "@/modules/notifications/notifications.module";
import { AdminModule } from "@/modules/admin/admin.module";
import { CoursesModule } from "@/modules/courses/courses.module";
import { LeaderboardModule } from "@/modules/leaderboard/leaderboard.module";
import { PointsModule } from "@/modules/points/points.module";
import { EmailModule } from "@/modules/email/email.module";
import { MediaModule } from "@/modules/media/media.module";
import { ProgressModule } from "@/modules/progress/progress.module";
import { QueueModule } from "@/queues/queue.module";
import { RedisModule } from "@/common/redis/redis.module";
import { HealthModule } from "@/health/health.module";
import { WebsocketModule } from "@/websocket/websocket.module";
import { EventsModule } from "@/events/events.module";
import { JobsModule } from "@/jobs/jobs.module";
import { MenuModule } from "@/modules/menu/menu.module";
import { validate } from "@/config/env.validation";

const isProduction = process.env.NODE_ENV === "production";
const envFilePath = isProduction
  ? [".env.production", ".env"]
  : [".env.development", ".env"];

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath,
      validate,
      cache: true,
    }),

    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: config.get<number>("THROTTLE_TTL") || 60000,
          limit: config.get<number>("THROTTLE_LIMIT") || 100,
        },
      ],
    }),

    BullModule.forRootAsync({
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get<string>("REDIS_HOST") || "localhost",
          port: config.get<number>("REDIS_PORT") || 6379,
        },
      }),
      inject: [ConfigService],
    }),

    PrismaModule,
    RedisModule,
    HealthModule,

    AuthModule,
    UsersModule,
    PermissionsModule,
    VocabularyModule,
    FlashcardsModule,
    QuizModule,
    GrammarModule,
    SpeakingModule,
    AnalyticsModule,
    NotificationsModule,
    AdminModule,
    // AiModule,
    CoursesModule,
    LeaderboardModule,
    PointsModule,
    EmailModule,
    MediaModule,
    ProgressModule,
    QueueModule,

    WebsocketModule,
    EventsModule,
    JobsModule,
    MenuModule,
  ],
  providers: [],
})
export class AppModule {}
