import { Module } from "@nestjs/common";
import { JwtModule, type JwtSignOptions } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { PrismaModule } from "@/prisma/prisma.module";
import { AuthController } from "@/modules/auth/controllers/auth.controller";
import { AuthService } from "@/modules/auth/services/auth.service";
import { PasswordResetService } from "@/modules/auth/services/password-reset.service";
import { JwtStrategy } from "@/modules/auth/strategies/jwt.strategy";
import { GoogleStrategy } from "@/modules/auth/strategies/google.strategy";
import { JwtAuthGuard } from "@/modules/auth/guards/jwt-auth.guard";
import { RedisModule } from "@/common/redis/redis.module";
import { AuditModule } from "@/modules/audit/audit.module";
import { VerificationModule } from "@/modules/verification/verification.module";
import { EmailModule } from "@/modules/email/email.module";

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: "jwt" }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>("JWT_SECRET"),
        signOptions: {
          expiresIn: configService.get<string>(
            "JWT_ACCESS_EXPIRES_IN",
            "15m",
          ) as JwtSignOptions["expiresIn"],
        },
      }),
    }),
    PrismaModule,
    RedisModule,
    AuditModule,
    VerificationModule,
    EmailModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    PasswordResetService,
    JwtStrategy,
    GoogleStrategy,
    JwtAuthGuard,
  ],
  exports: [AuthService, JwtAuthGuard],
})
export class AuthModule {}
