export const environment = {
  production: false,
  isProduction: false,
  isDevelopment: true,

  // Application
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: 'development',

  // Database
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/english_learning',

  // Redis
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || '',
  },

  // Security - Development relaxed settings
  https: {
    enabled: process.env.ENABLE_HTTPS === 'true',
    requireHttps: false,
  },
  trustProxy: false,
  secureCookie: false,

  // CORS - Development relaxed settings
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3681',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'X-Requested-With'],
  },

  // Rate Limiting - More lenient in development
  throttle: {
    ttl: parseInt(process.env.THROTTLE_TTL || '60000', 10),
    limit: parseInt(process.env.THROTTLE_LIMIT || '100', 10),
  },

  // Logging - Verbose in development
  logging: {
    level: process.env.LOG_LEVEL || 'debug',
    verbose: true,
  },

  // Swagger - Enabled in development
  swagger: {
    enabled: process.env.ENABLE_SWAGGER !== 'false',
    path: 'api/docs',
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-jwt-secret-key-change-in-production-32chars',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-key-change-in-production-32chars',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  // Storage (MinIO/S3)
  storage: {
    endpoint: process.env.S3_ENDPOINT || 'http://localhost:9000',
    accessKey: process.env.S3_ACCESS_KEY || 'minioadmin',
    secretKey: process.env.S3_SECRET_KEY || 'minioadmin',
    bucket: process.env.S3_BUCKET || 'english-learning',
    region: process.env.S3_REGION || 'us-east-1',
    publicUrl: process.env.S3_PUBLIC_URL || 'http://localhost:9000',
  },

  // SSL (not used in development)
  ssl: {
    certPath: '',
    keyPath: '',
  },
};
