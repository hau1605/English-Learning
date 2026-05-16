import { plainToClass } from 'class-transformer';
import { validateSync } from 'class-validator';
import { IsString, IsNumber, IsBoolean, IsOptional, MinLength } from 'class-validator';

class EnvironmentVariables {
  // Application
  @IsNumber()
  @IsOptional()
  PORT?: number;

  @IsString()
  @IsOptional()
  NODE_ENV?: string;

  // Database
  @IsString()
  DATABASE_URL!: string;

  // Redis
  @IsString()
  @IsOptional()
  REDIS_HOST?: string;

  @IsNumber()
  @IsOptional()
  REDIS_PORT?: number;

  @IsString()
  @IsOptional()
  REDIS_PASSWORD?: string;

  // JWT
  @IsString()
  @MinLength(32, { message: 'JWT_SECRET must be at least 32 characters' })
  JWT_SECRET!: string;

  @IsString()
  @MinLength(32, { message: 'JWT_REFRESH_SECRET must be at least 32 characters' })
  JWT_REFRESH_SECRET!: string;

  @IsString()
  @IsOptional()
  JWT_ACCESS_EXPIRES_IN?: string;

  @IsString()
  @IsOptional()
  JWT_REFRESH_EXPIRES_IN?: string;

  // Frontend URL (for CORS)
  @IsString()
  @IsOptional()
  FRONTEND_URL?: string;

  // Storage (MinIO/S3)
  @IsString()
  @IsOptional()
  S3_ENDPOINT?: string;

  @IsString()
  @IsOptional()
  S3_ACCESS_KEY?: string;

  @IsString()
  @IsOptional()
  S3_SECRET_KEY?: string;

  @IsString()
  @IsOptional()
  S3_BUCKET?: string;

  @IsString()
  @IsOptional()
  S3_REGION?: string;

  @IsString()
  @OptionalPublic()
  S3_PUBLIC_URL?: string;

  // Rate Limiting
  @IsNumber()
  @IsOptional()
  THROTTLE_TTL?: number;

  @IsNumber()
  @IsOptional()
  THROTTLE_LIMIT?: number;

  // Logging
  @IsString()
  @IsOptional()
  LOG_LEVEL?: string;

  // Security
  @IsBoolean()
  @IsOptional()
  ENABLE_HTTPS?: boolean;

  @IsBoolean()
  @IsOptional()
  TRUST_PROXY?: boolean;

  @IsBoolean()
  @IsOptional()
  ENABLE_SWAGGER?: boolean;

  // Nginx/SSL
  @IsString()
  @IsOptional()
  SSL_CERT_PATH?: string;

  @IsString()
  @IsOptional()
  SSL_KEY_PATH?: string;

  // Cookie
  @IsBoolean()
  @IsOptional()
  SECURE_COOKIE?: boolean;

  // CORS
  @IsString()
  @IsOptional()
  CORS_ORIGIN?: string;

  // CORS Methods
  @IsString()
  @IsOptional()
  CORS_METHODS?: string;

  // CORS Headers
  @IsString()
  @IsOptional()
  CORS_HEADERS?: string;

  @IsNumber()
  @IsOptional()
  RETENTION_ANALYTICS_DAYS?: number;

  @IsNumber()
  @IsOptional()
  RETENTION_QUEUE_DAYS?: number;

  @IsNumber()
  @IsOptional()
  RETENTION_ORPHAN_MEDIA_DAYS?: number;
}

// Custom decorator for optional but validated when present
function OptionalPublic() {
  return IsOptional();
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToClass(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    const errorMessages = errors.map((err) => {
      const constraints = err.constraints ? Object.values(err.constraints).join(', ') : 'Unknown error';
      return `${err.property}: ${constraints}`;
    });
    throw new Error(`Environment validation failed:\n${errorMessages.join('\n')}`);
  }

  return validatedConfig;
}

// Helper to check if running in production
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

// Helper to check if running in development
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}
