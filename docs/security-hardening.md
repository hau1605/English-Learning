# Security Hardening - English Learning Platform

# Mục tiêu

Tài liệu này mô tả chi tiết các biện pháp bảo mật và best practices để bảo vệ hệ thống English Learning Platform.

---

# 1. Authentication Security

# 1.1 Password Security

# Password Requirements

| Requirement | Value |
|-------------|-------|
| Minimum length | 8 characters |
| Maximum length | 128 characters |
| Uppercase letters | Required (A-Z) |
| Lowercase letters | Required (a-z) |
| Numbers | Required (0-9) |
| Special characters | Required (!@#$%^&*) |
| Common passwords | Not allowed |

# Password Hashing

# Algorithm: Argon2id

```typescript
import * as argon2 from 'argon2';

async function hashPassword(password: string): Promise<string> {
  return await argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 65536, // 64 MB
    timeCost: 3,       // 3 iterations
    parallelism: 4,    // 4 parallel threads
  });
}

async function verifyPassword(hash: string, password: string): Promise<boolean> {
  return await argon2.verify(hash, password);
}
```

# Why Argon2?

| Algorithm | Time | Memory | GPU Resistant |
|-----------|------|--------|---------------|
| bcrypt | Low | Low | No |
| scrypt | Medium | High | Partial |
| Argon2id | High | High | Yes |

---

# 1.2 Token Security

# JWT Configuration

```typescript
// Access Token
{
  secret: process.env.JWT_ACCESS_SECRET,
  expiresIn: '15m',
  algorithm: 'HS256',
}

// Refresh Token
{
  secret: process.env.JWT_REFRESH_SECRET,
  expiresIn: '7d',
  algorithm: 'HS256',
}
```

# Token Payload

```json
{
  "sub": "user-uuid",
  "sessionId": "session-uuid",
  "type": "access",
  "iat": 1704067200,
  "exp": 1704068100
}
```

# Token Storage

| Token | Storage | Reason |
|-------|---------|--------|
| Access Token | Memory (JS variable) | Short-lived, prevents XSS |
| Refresh Token | httpOnly Cookie | Prevents XSS theft |

# Token Rotation

```typescript
// On every token refresh
async function refreshTokens(refreshToken: string) {
  // 1. Validate refresh token
  const payload = verifyRefreshToken(refreshToken);

  // 2. Check if token is revoked
  const isRevoked = await checkTokenRevoked(payload.jti);
  if (isRevoked) throw new UnauthorizedException();

  // 3. Revoke old token
  await revokeToken(payload.jti);

  // 4. Generate new tokens
  const newAccessToken = generateAccessToken(payload);
  const newRefreshToken = generateRefreshToken(payload);

  // 5. Store new refresh token
  await storeRefreshToken(payload.userId, newRefreshToken);

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
}
```

---

# 1.3 Session Security

# Session Configuration

```typescript
{
  name: '__Host-session',
  secret: process.env.SESSION_SECRET,
  cookie: {
    httpOnly: true,
    secure: true,        // HTTPS only
    sameSite: 'strict', // CSRF protection
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
  },
  resave: false,
  saveUninitialized: false,
}
```

---

# 2. API Security

# 2.1 Input Validation

# DTO Validation Example

```typescript
import { IsEmail, IsString, MinLength, MaxLength, Matches } from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'Invalid email format' })
  email: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @MaxLength(128, { message: 'Password must not exceed 128 characters' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: 'Password must contain uppercase, lowercase, number, and special character',
  })
  password: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  fullName: string;
}
```

# Sanitization

```typescript
import DOMPurify from 'isomorphic-dompurify';

// Sanitize HTML input
function sanitizeInput(input: string): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  });
}

// Validate and sanitize
function validateInput(input: unknown) {
  const sanitized = sanitizeInput(String(input));
  // Validate sanitized input
  return schema.parse(sanitized);
}
```

---

# 2.2 Rate Limiting

# Rate Limit Tiers

| Tier | Limit | Window | For |
|------|-------|--------|-----|
| Anonymous | 20/min | 1 minute | Unauthenticated users |
| Authenticated | 100/min | 1 minute | Logged in users |
| Premium | 500/min | 1 minute | Premium users |

# Endpoint-specific Limits

| Endpoint | Limit | Window | Scope |
|----------|-------|--------|-------|
| POST /auth/login | 5 | 1 minute | IP |
| POST /auth/register | 3 | 1 hour | IP |
| POST /auth/forgot-password | 3 | 1 hour | IP |
| POST /flashcards/review | 60 | 1 minute | User |
| POST /quizzes/:id/submit | 10 | 1 minute | User |
| POST /ai/* | 10 | 1 minute | User |

# Implementation

```typescript
// Redis-based rate limiter
async function checkRateLimit(
  key: string,
  limit: number,
  window: number
): Promise<{ allowed: boolean; remaining: number; reset: number }> {
  const redisKey = `rate_limit:${key}`;
  const now = Date.now();

  // Remove old entries
  await redis.zremrangebyscore(redisKey, 0, now - window);

  // Count current requests
  const count = await redis.zcard(redisKey);

  if (count >= limit) {
    const oldestEntry = await redis.zrange(redisKey, 0, 0, 'WITHSCORES');
    const reset = parseInt(oldestEntry[1]) + window;

    return { allowed: false, remaining: 0, reset };
  }

  // Add new entry
  await redis.zadd(redisKey, now, `${now}-${Math.random()}`);
  await redis.expire(redisKey, Math.ceil(window / 1000));

  return { allowed: true, remaining: limit - count - 1, reset: now + window };
}
```

---

# 2.3 SQL Injection Prevention

# Use Prisma (ORM)

```typescript
// Safe - using Prisma
const user = await prisma.user.findUnique({
  where: { email },
});

// Safe - parameterized query
const users = await prisma.$queryRaw`
  SELECT * FROM users
  WHERE email = ${email}
`;

// Unsafe - NEVER do this
// const users = await prisma.$queryRaw(`SELECT * FROM users WHERE email = '${email}'`);
```

---

# 2.4 XSS Prevention

# Content Security Policy

```typescript
// helmet CSP configuration
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'nonce-{NONCE}'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", "data:", "https:"],
    fontSrc: ["'self'", "https://fonts.gstatic.com"],
    connectSrc: ["'self'", "https://api.example.com"],
    frameSrc: ["'none'"],
    objectSrc: ["'none'"],
    upgradeInsecureRequests: [],
  },
}));
```

# Output Encoding

```typescript
import { htmlEscape } from 'escape-goat';

// Safe HTML output
function safeHtml(unsafe: string): string {
  return htmlEscape(unsafe);
}
```

---

# 3. Data Security

# 3.1 Sensitive Data Handling

# Environment Variables

```bash
# .env.example (NEVER commit real values)
DATABASE_URL=postgresql://user:password@host:5432/db
REDIS_URL=redis://:password@host:6379
JWT_ACCESS_SECRET=your-access-secret-here
JWT_REFRESH_SECRET=your-refresh-secret-here
ENCRYPTION_KEY=your-32-char-encryption-key
```

# Secrets Management

| Secret | Storage | Rotation |
|--------|---------|----------|
| Database credentials | Environment / Vault | 90 days |
| JWT secrets | Environment / Vault | 30 days |
| API keys | Environment / Vault | On compromise |
| Encryption keys | HSM / Vault | 365 days |

# Encrypted Fields

```typescript
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

function encrypt(text: string, key: Buffer): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

function decrypt(encrypted: string, key: Buffer): string {
  const [ivHex, authTagHex, encryptedText] = encrypted.split(':');

  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
```

---

# 3.2 Data Encryption at Rest

# Database Encryption

```sql
-- Enable encryption for sensitive columns
ALTER TABLE users ADD COLUMN sensitive_data_encrypted TEXT;

-- Encrypted data format: iv:authTag:ciphertext
```

# File Encryption

```typescript
// Upload encryption flow
async function uploadEncryptedFile(file: Buffer, key: Buffer): Promise<string> {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([cipher.update(file), cipher.final()]);
  const authTag = cipher.getAuthTag();

  // Upload encrypted data to storage
  const fileKey = `files/${crypto.randomUUID()}.enc`;
  await storage.upload(fileKey, Buffer.concat([iv, authTag, encrypted]));

  return fileKey;
}
```

---

# 4. Infrastructure Security

# 4.1 Security Headers

# Recommended Headers

```typescript
import helmet from 'helmet';

// Apply security headers
app.use(helmet());

// Custom configuration
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      connectSrc: ["'self'"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
    },
  },
  hsts: {
    maxAge: 31536000,        // 1 year
    includeSubDomains: true,
    preload: true,
  },
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin',
  },
  noSniff: true,
  frameguard: {
    action: 'deny',
  },
  xssFilter: true,
}));
```

# Header Reference

| Header | Value | Purpose |
|--------|-------|---------|
| Strict-Transport-Security | max-age=31536000 | Force HTTPS |
| X-Content-Type-Options | nosniff | Prevent MIME sniffing |
| X-Frame-Options | DENY | Prevent clickjacking |
| X-XSS-Protection | 1; mode=block | XSS filter |
| Referrer-Policy | strict-origin | Control referrer info |
| Content-Security-Policy | See above | Prevent XSS/injection |

---

# 4.2 CORS Configuration

```typescript
const corsOptions = {
  origin: (origin: string | undefined, callback: Function) => {
    const allowedOrigins = [
      'https://app.example.com',
      'https://admin.example.com',
      'http://localhost:3000', // Development
    ];

    // Allow requests with no origin (mobile apps, curl)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining'],
  credentials: true,
  maxAge: 86400, // 24 hours
};

app.use(cors(corsOptions));
```

---

# 4.3 Network Security

# Firewall Rules

```txt
# Allow only necessary ports
22  - SSH (from specific IP only)
80  - HTTP (redirect to HTTPS)
443 - HTTPS
5432 - PostgreSQL (from app servers only)
6379 - Redis (from app servers only)
```

# Database Access

```typescript
// PostgreSQL connection with SSL
const connection = await createConnection({
  url: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: true,
    ca: fs.readFileSync('/path/to/ca.crt'),
  },
});
```

---

# 5. Application Security

# 5.1 CSRF Protection

# CSRF Token

```typescript
// Generate CSRF token
function generateCsrfToken(sessionId: string): string {
  return crypto
    .createHmac('sha256', process.env.CSRF_SECRET!)
    .update(sessionId)
    .digest('hex');
}

// Validate CSRF token
function validateCsrfToken(token: string, sessionId: string): boolean {
  const expectedToken = generateCsrfToken(sessionId);
  return crypto.timingSafeEqual(
    Buffer.from(token),
    Buffer.from(expectedToken)
  );
}
```

# CSRF Middleware

```typescript
// Only for state-changing requests
const csrfProtectedMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];

app.use((req, res, next) => {
  if (!csrfProtectedMethods.includes(req.method)) {
    return next();
  }

  const csrfToken = req.headers['x-csrf-token'];
  const sessionId = req.session?.id;

  if (!csrfToken || !sessionId) {
    return res.status(403).json({ error: 'CSRF token required' });
  }

  if (!validateCsrfToken(csrfToken as string, sessionId)) {
    return res.status(403).json({ error: 'Invalid CSRF token' });
  }

  next();
});
```

---

# 5.2 Audit Logging

# Events to Log

```typescript
const securityEvents = [
  'auth.login_success',
  'auth.login_failure',
  'auth.logout',
  'auth.register',
  'auth.password_reset_request',
  'auth.password_reset_complete',
  'auth.token_refresh',
  'auth.session_revoked',
  'user.permission_changed',
  'admin.user_deleted',
  'file.upload',
  'file.delete',
];

interface AuditLog {
  id: string;
  event: string;
  userId?: string;
  ipAddress: string;
  userAgent: string;
  metadata: Record<string, any>;
  timestamp: Date;
}
```

# Audit Log Implementation

```typescript
async function logSecurityEvent(
  event: string,
  userId: string | null,
  request: Request,
  metadata: Record<string, any> = {}
) {
  await prisma.auditLog.create({
    data: {
      event,
      userId,
      ipAddress: getClientIP(request),
      userAgent: request.headers['user-agent'],
      metadata,
      createdAt: new Date(),
    },
  });
}
```

---

# 6. Security Checklist

# Authentication & Authorization

- [x] Strong password hashing (Argon2id)
- [ ] Password complexity requirements
- [ ] Password breach checking (HaveIBeenPwned)
- [x] Multi-factor authentication (TOTP)
- [x] JWT with short expiration
- [x] Refresh token rotation
- [x] Session management
- [ ] Device management (view/revoke)
- [ ] Login attempt limiting
- [ ] Account lockout policy

# API Security

- [x] Input validation
- [x] Rate limiting
- [x] SQL injection prevention
- [x] XSS prevention
- [ ] CSRF protection
- [ ] Request signing
- [ ] API key management
- [ ] OAuth 2.0 implementation

# Data Security

- [x] Sensitive data encryption
- [ ] Database encryption at rest
- [ ] Backup encryption
- [ ] Key rotation policy
- [ ] Secure file storage

# Infrastructure

- [x] Security headers
- [x] CORS configuration
- [ ] Firewall rules
- [ ] DDoS protection
- [ ] WAF implementation
- [ ] SSL/TLS configuration
- [ ] Regular security updates

# Monitoring & Response

- [x] Security audit logging
- [x] Failed login monitoring
- [ ] Anomaly detection
- [ ] Security incident response
- [ ] Regular security audits
- [ ] Penetration testing

---

# 7. Security Testing

# OWASP Top 10 Coverage

| OWASP Top 10 | Mitigation |
|--------------|------------|
| A01 Broken Access Control | RBAC, Permission guards |
| A02 Cryptographic Failures | Argon2, TLS, Encryption |
| A03 Injection | Prisma ORM, Input validation |
| A04 Insecure Design | Threat modeling, Secure defaults |
| A05 Security Misconfiguration | Hardened configs, Security headers |
| A06 Vulnerable Components | Dependency scanning, Updates |
| A07 Auth Failures | Strong auth, MFA, Rate limiting |
| A08 Data Integrity Failures | CSRF tokens, Integrity checks |
| A09 Logging Failures | Comprehensive audit logs |
| A10 SSRF | URL validation, Allow lists |

---

# 8. Incident Response

# Response Plan

```txt
1. Detection
   - Alert triggered
   - Initial assessment

2. Containment
   - Isolate affected systems
   - Preserve evidence

3. Investigation
   - Root cause analysis
   - Impact assessment
   - Log analysis

4. Remediation
   - Apply fixes
   - Update systems
   - Verify fixes

5. Recovery
   - Restore services
   - Verify integrity
   - Monitor for recurrence

6. Post-incident
   - Document lessons learned
   - Update security measures
   - Notify affected users (if required)
```

# Emergency Contacts

| Contact | Responsibility |
|---------|----------------|
| Security Team | Primary incident response |
| DevOps | Infrastructure support |
| Legal | Compliance and notifications |
| Management | Escalation and communication |

---

# 9. Compliance

# GDPR Considerations

- Right to access personal data
- Right to deletion ("right to be forgotten")
- Data portability
- Consent management
- Data breach notification (72 hours)

# Data Retention

| Data Type | Retention Period | Deletion |
|-----------|------------------|----------|
| User accounts | Active + 2 years | Anonymize |
| Audit logs | 1 year | Delete |
| Session data | 7 days | Auto-delete |
| Analytics | 2 years | Aggregate/delete |
| Backups | 30 days | Rotate |

---

# 10. Revision History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2024-01-01 | Initial version |
