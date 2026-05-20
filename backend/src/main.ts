import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import express from 'express';
import { join } from 'path';
import { AppModule } from '@/app.module';
import { HttpExceptionFilter } from '@/common/filters/http-exception.filter';
import { TransformInterceptor } from '@/common/interceptors/transform.interceptor';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const isProduction = configService.get<string>('NODE_ENV') === 'production';

  // Cookie parser
  app.use(cookieParser());
  const localUploadRoot =
    configService.get<string>('LOCAL_UPLOAD_ROOT') || join(process.cwd(), 'uploads');
  app.use('/uploads', express.static(localUploadRoot));

  // CORS configuration based on environment
  const frontendUrl = configService.get<string>('FRONTEND_URL') || 'http://localhost:3681';
  const corsMethods = configService.get<string>('CORS_METHODS')?.split(',') || ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'];
  const corsHeaders = configService.get<string>('CORS_HEADERS')?.split(',') || ['Content-Type', 'Authorization', 'Cookie'];
  const secureCookie = configService.get<boolean>('SECURE_COOKIE') || false;

  app.enableCors({
    origin: frontendUrl,
    credentials: true,
    methods: corsMethods,
    allowedHeaders: corsHeaders,
  });

  // Trust proxy in production
  if (configService.get<boolean>('TRUST_PROXY') || isProduction) {
    const expressInstance = app.getHttpAdapter().getInstance();
    expressInstance.set('trust proxy', true);
  }

  app.setGlobalPrefix('api/v1', {
    exclude: ['health'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  // Swagger - disabled in production by default
  const enableSwagger = configService.get<boolean>('ENABLE_SWAGGER');
  if (enableSwagger === true || !isProduction) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('English Learning Platform API')
      .setDescription('API documentation for English Learning Platform')
      .setVersion('1.0')
      .addBearerAuth()
      .addCookieAuth('refreshToken')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document);
  }

  const port = configService.get<number>('PORT') || 3000;
  const protocol = isProduction && configService.get<boolean>('ENABLE_HTTPS') ? 'https' : 'http';

  await app.listen(port);
  logger.log(`Application is running on: ${protocol}://localhost:${port}`);

  if (enableSwagger === true || !isProduction) {
    logger.log(`Swagger docs available at: http://localhost:${port}/api/docs`);
  }

  // Production warnings
  if (isProduction) {
    logger.warn('Running in PRODUCTION mode - ensure all security settings are configured');
    if (!configService.get<string>('JWT_SECRET')?.includes('CHANGE_THIS')) {
      logger.warn('JWT_SECRET appears to be set - good!');
    }
  }
}

bootstrap();
