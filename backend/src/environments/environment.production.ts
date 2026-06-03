export const environment = {
  production: true,
  isProduction: true,
  isDevelopment: false,

  // Application
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: 'production',

  // Database
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgres@postgres:5432/english_learning',

  // Redis
  redis: {
    host: process.env.REDIS_HOST || 'redis',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || '',
  },

  // Security - Production strict settings
  https: {
    enabled: process.env.ENABLE_HTTPS === 'true',
    requireHttps: process.env.ENABLE_HTTPS === 'true',
  },
  trustProxy: process.env.TRUST_PROXY !== 'false',
  secureCookie: process.env.SECURE_COOKIE !== 'false',

  // CORS - Production strict settings
  cors: {
    origin: process.env.FRONTEND_URL || 'https://your-domain.com',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  },

  // Rate Limiting - Stricter in production
  throttle: {
    enabled: process.env.RATE_LIMIT_ENABLED !== 'false',
    ttl: parseInt(process.env.THROTTLE_TTL || '60000', 10),
    limit: parseInt(process.env.THROTTLE_LIMIT || '100', 10),
  },

  // Logging - Production logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    verbose: false,
  },

  // Swagger - Disabled in production by default
  swagger: {
    enabled: process.env.ENABLE_SWAGGER === 'true',
    path: 'api/docs',
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || '',
    refreshSecret: process.env.JWT_REFRESH_SECRET || '',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  // Storage (MinIO/S3)
  storage: {
    endpoint: process.env.S3_ENDPOINT || 'http://minio:9000',
    accessKey: process.env.S3_ACCESS_KEY || 'minioadmin',
    secretKey: process.env.S3_SECRET_KEY || 'minioadmin',
    bucket: process.env.S3_BUCKET || 'english-learning',
    region: process.env.S3_REGION || 'us-east-1',
    publicUrl: process.env.S3_PUBLIC_URL || 'http://minio:9000',
  },

  // SSL - Production SSL settings
  ssl: {
    certPath: process.env.SSL_CERT_PATH || '/etc/nginx/ssl/cert.pem',
    keyPath: process.env.SSL_KEY_PATH || '/etc/nginx/ssl/key.pem',
  },
};
