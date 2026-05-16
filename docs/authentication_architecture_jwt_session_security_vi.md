# Authentication Architecture - JWT, Sessions, Security & Production Strategy

# Mục tiêu

Tài liệu này mô tả chi tiết kiến trúc xác thực production-ready cho hệ thống scalable.

Bao gồm:

- JWT authentication
- access token
- refresh token
- session management
- Redis auth cache
- multi-device authentication
- RBAC integration
- websocket authentication
- security best practices
- scalable auth architecture
- production deployment strategy

Tài liệu này dùng làm:

- authentication guideline
- Cursor AI rules
- backend implementation reference
- frontend auth reference
- security standards

---

# 1. Authentication Goals

Hệ thống authentication phải:

- secure
- scalable
- stateless
- multi-device support
- revoke-able
- cacheable
- mobile-ready
- websocket-ready
- RBAC-compatible
- production-ready

---

# 2. Recommended Authentication Stack

# Backend

```txt
NestJS
Passport.js
JWT
Redis
PostgreSQL
```

---

# Frontend

```txt
Next.js
React Query
Zustand
Axios
```

---

# Security

```txt
argon2
helmet
rate limiting
httpOnly cookies
```

---

# 3. Authentication Architecture

# Recommended Flow

```txt
Client
   |
Login Request
   |
NestJS Auth Service
   |
Validate Credentials
   |
Generate Access Token
Generate Refresh Token
   |
Save Session
   |
Return Tokens
```

---

# Access Token

Dùng cho:

```txt
API authentication
```

---

# Refresh Token

Dùng cho:

```txt
renew access token
```

---

# 4. Token Strategy

# Access Token

## TTL

```txt
15 minutes
```

---

# Access Token Payload

```json
{
  "sub": "user-id",
  "sessionId": "uuid",
  "type": "access",
  "iat": 123,
  "exp": 123
}
```

---

# Không nhét nhiều data vào JWT

Sai:

```json
{
  "fullUser": {}
}
```

---

# Refresh Token

## TTL

```txt
7 - 30 days
```

---

# Refresh Token Payload

```json
{
  "sub": "user-id",
  "sessionId": "uuid",
  "type": "refresh",
  "iat": 123,
  "exp": 123
}
```

---

# 5. Refresh Token Rotation

# Bắt buộc

Mỗi lần refresh:

```txt
invalidate old refresh token
create new refresh token
```

---

# Vì sao?

Nếu refresh token bị leak:

→ attacker không thể dùng mãi.

---

# Refresh Flow

```txt
Client sends refresh token
        |
Validate refresh token
        |
Check session
        |
Revoke old token
        |
Generate new tokens
        |
Update session
        |
Return new tokens
```

---

# 6. Session Architecture

# Không stateless hoàn toàn

Production thực tế cần session tracking.

---

# User Sessions Table

```sql
CREATE TABLE user_sessions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  refresh_token_hash TEXT NOT NULL,
  device_info TEXT,
  ip_address TEXT,
  user_agent TEXT,
  expired_at TIMESTAMP,
  revoked_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

# Session Responsibilities

- multi-device login
- revoke sessions
- logout specific devices
- suspicious login tracking
- audit logs

---

# 7. Redis Authentication Cache

# Redis dùng cho

- session cache
- permission cache
- rate limiting
- token blacklist
- auth throttling

---

# Session Cache Key

```txt
session:session_id
```

---

# Permission Cache Key

```txt
permissions:user_id
```

---

# Rate Limit Key

```txt
rate_limit:login:ip
```

---

# 8. Recommended Login Flow

```txt
User Login
    |
Validate Email
Validate Password
    |
Generate Session ID
    |
Generate Access Token
Generate Refresh Token
    |
Hash Refresh Token
    |
Save Session
    |
Set Cookie
    |
Return Access Token
```

---

# 9. Password Security

# Bắt buộc

Dùng:

```txt
argon2
```

hoặc:

```txt
bcrypt
```

---

# Không dùng

```txt
md5
sha1
plain text
```

---

# Password Rules

- minimum 8 chars
- uppercase
- lowercase
- number
- special char

---

# Password Hashing Example

```ts
const hash = await argon2.hash(password);
```

---

# 10. HTTP-only Cookie Strategy

# Recommended

## Access Token

```txt
memory storage
```

---

## Refresh Token

```txt
httpOnly cookie
```

---

# Cookie Configuration

```txt
httpOnly: true
secure: true
sameSite: strict
```

---

# Vì sao?

Giảm:

- XSS attacks
- token theft

---

# 11. NestJS Auth Module Structure

```txt
modules/
 └── auth/
      ├── controllers/
      ├── services/
      ├── guards/
      ├── strategies/
      ├── repositories/
      ├── dto/
      ├── interfaces/
      ├── decorators/
      ├── events/
      ├── listeners/
      ├── jobs/
      ├── constants/
      └── auth.module.ts
```

---

# 12. Auth Guards

# JWT Auth Guard

Responsibility:

- validate access token
- attach user context

---

# Permission Guard

Responsibility:

- validate permissions
- RBAC authorization

---

# Guard Flow

```txt
Request
   |
JWT Guard
   |
Attach User
   |
Permission Guard
   |
Controller
```

---

# 13. JWT Strategy

# Validate Token

```ts
async validate(payload: JwtPayload) {
  const session = await this.authService.validateSession(
    payload.sessionId,
  );

  if (!session) {
    throw new UnauthorizedException();
  }

  return {
    userId: payload.sub,
    sessionId: payload.sessionId,
  };
}
```

---

# 14. Logout Flow

# Logout All Devices

```txt
revoke all sessions
clear cookies
invalidate cache
```

---

# Logout Current Device

```txt
revoke current session only
```

---

# Logout Flow

```txt
Client Logout
      |
Validate Session
      |
Revoke Session
      |
Blacklist Access Token
      |
Clear Cookies
```

---

# 15. Token Blacklist

# Use Case

Nếu access token chưa expire nhưng user logout.

---

# Redis Key

```txt
blacklist:jwt_id
```

---

# TTL

TTL = token expiration.

---

# 16. RBAC Integration

# JWT không nên chứa full permissions

Sai:

```json
{
  "permissions": [1000 items]
}
```

---

# Recommended

JWT:

```txt
sub
sessionId
```

Permissions:

```txt
Redis cache
```

---

# Authorization Flow

```txt
JWT Auth
   |
Get Cached Permissions
   |
Permission Guard
   |
Authorize Request
```

---

# 17. WebSocket Authentication

# Socket Flow

```txt
Client Connect
      |
Send Access Token
      |
Validate JWT
      |
Validate Session
      |
Attach User Context
      |
Allow Connection
```

---

# Gateway Example

```ts
async handleConnection(client: Socket) {
  const token = extractToken(client);

  const payload = verifyJwt(token);

  const session = await validateSession(payload.sessionId);

  if (!session) {
    client.disconnect();
  }
}
```

---

# 18. Multi-device Authentication

# Supported Devices

```txt
Chrome
Firefox
Mobile
Tablet
Desktop App
```

---

# User Session Management

User có thể:

- xem active sessions
- revoke sessions
- logout specific devices

---

# Session Example

```txt
Chrome - Windows
Firefox - Linux
iPhone App
```

---

# 19. Email Verification Flow

```txt
Register
    |
Generate Verification Token
    |
Send Email
    |
User Click Link
    |
Validate Token
    |
Activate Account
```

---

# Verification Table

```txt
email_verification_tokens
- id
- user_id
- token_hash
- expired_at
```

---

# 20. Forgot Password Flow

```txt
Request Reset
      |
Generate Reset Token
      |
Send Email
      |
User Opens Link
      |
Validate Token
      |
Reset Password
```

---

# Reset Token Table

```txt
password_reset_tokens
- id
- user_id
- token_hash
- expired_at
```

---

# 21. Social Login Architecture

# Providers

- Google
- Facebook
- Apple

---

# Recommended Flow

```txt
Frontend OAuth
      |
Provider Token
      |
Backend Validation
      |
Internal JWT Generation
      |
Create Session
      |
Return Internal Tokens
```

---

# Không dùng provider token trực tiếp

Luôn convert sang internal JWT.

---

# 22. Rate Limiting Strategy

# API Limits

| Endpoint | Limit |
|---|---|
| login | 5/min |
| register | 5/hour |
| refresh | 20/min |
| forgot-password | 3/hour |

---

# Redis-based Rate Limit

```txt
rate_limit:login:ip
```

---

# 23. Security Best Practices

# Bắt buộc

- HTTPS only
- helmet
- CORS
- secure cookies
- validation
- password hashing
- rate limiting

---

# Không trust frontend

Backend phải validate toàn bộ.

---

# Không log sensitive data

Không log:

- passwords
- refresh tokens
- JWT secrets

---

# 24. Audit Logging

# Track

- login attempts
- failed logins
- session revokes
- password resets
- permission changes

---

# Audit Table

```txt
audit_logs
- id
- actor_id
- action
- metadata
- created_at
```

---

# 25. Frontend Authentication Architecture

# Auth Store

Dùng:

```txt
Zustand
```

---

# React Query

Dùng cho:

```txt
me endpoint
session refresh
```

---

# Axios Interceptor

Responsibility:

- attach access token
- refresh expired token
- retry request

---

# Frontend Flow

```txt
Request API
    |
Attach Access Token
    |
401?
    |
Refresh Token
    |
Retry Request
```

---

# 26. Production Infrastructure

# Recommended Stack

```txt
Nginx
NestJS
PostgreSQL
Redis
BullMQ
Docker
```

---

# Recommended Deployment

```txt
frontend
backend
postgres
redis
worker
nginx
```

---

# 27. Monitoring & Observability

# Track Metrics

- login success rate
- login failure rate
- token refresh rate
- active sessions
- suspicious logins
- auth response times

---

# Alerts

Ví dụ:

```txt
Too many failed logins
```

→ possible brute-force attack.

---

# 28. Testing Strategy

# Unit Tests

Test:

- token generation
- password hashing
- refresh flow
- session validation

---

# Integration Tests

Test:

- login
- logout
- refresh token
- websocket auth

---

# E2E Tests

Test:

- full auth flow
- multi-device logout
- RBAC authorization
- protected routes

---

# 29. Cursor AI Rules

# Cursor phải:

- use JWT access + refresh strategy
- implement refresh token rotation
- use httpOnly cookies
- use Redis session validation
- never hardcode auth logic
- separate auth service properly
- follow auth module structure
- validate all inputs

---

# Cursor không được:

- store passwords plain text
- store refresh tokens plain text
- trust frontend auth state
- bypass auth guards
- embed huge payloads in JWT
- use localStorage for refresh tokens

---

# 30. Recommended Auth Architecture

# Best Production-ready Architecture

```txt
JWT Access Token
Refresh Token Rotation
Redis Session Cache
RBAC Authorization
WebSocket Auth
Audit Logs
Rate Limiting
```

---

# 31. Final Recommendations

# Nên dùng

- access + refresh token
- Redis session cache
- RBAC integration
- session tracking
- multi-device sessions
- refresh token rotation
- httpOnly cookies
- websocket auth

---

# Không nên

- stateless auth hoàn toàn
- localStorage refresh token
- hardcoded permissions
- no session tracking
- no logout revocation
- huge JWT payloads

---

# Kết luận

Kiến trúc này:

- scalable
- secure
- production-ready
- multi-device support
- websocket-ready
- RBAC-compatible
- mobile-ready
- suitable for SaaS systems
- suitable for large-scale systems

và phù hợp để Cursor AI generate code theo đúng production standards.

