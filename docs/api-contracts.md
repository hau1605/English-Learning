# API Contracts Standardization - English Learning Platform

# Mục tiêu

Tài liệu này chuẩn hóa tất cả API endpoints về format request/response, pagination, error handling, và versioning.

---

# 1. Base Configuration

# API Base URL

```txt
Development: http://localhost:3000/api/v1
Staging: https://staging-api.example.com/api/v1
Production: https://api.example.com/api/v1
```

# API Versioning

```txt
/api/v1/resource
/api/v2/resource
```

# Common Headers

```txt
Content-Type: application/json
Authorization: Bearer <access_token>
X-Request-ID: <uuid>
X-Timezone: Asia/Ho_Chi_Minh
```

---

# 2. Standard Response Format

# 2.1 Success Response

# Format

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {},
  "meta": {}
}
```

# Meta Object (Optional)

```json
{
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5
    },
    "timestamp": "2024-01-01T00:00:00.000Z",
    "requestId": "uuid"
  }
}
```

# Single Resource Response

```json
{
  "success": true,
  "message": "User retrieved successfully",
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "fullName": "John Doe",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

# Collection Response

```json
{
  "success": true,
  "message": "Users retrieved successfully",
  "data": [
    { "id": "uuid1", "email": "user1@example.com" },
    { "id": "uuid2", "email": "user2@example.com" }
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 50,
      "totalPages": 3
    }
  }
}
```

---

# 2.2 Error Response

# Format

```json
{
  "success": false,
  "message": "Human-readable error message",
  "code": "ERROR_CODE",
  "errors": []
}
```

# Error Codes

| Code | HTTP Status | Description |
|------|------------|-------------|
| VALIDATION_ERROR | 400 | Invalid input data |
| UNAUTHORIZED | 401 | Missing or invalid token |
| FORBIDDEN | 403 | Insufficient permissions |
| NOT_FOUND | 404 | Resource not found |
| CONFLICT | 409 | Resource conflict |
| RATE_LIMITED | 429 | Too many requests |
| INTERNAL_ERROR | 500 | Server error |

# Validation Error Response

```json
{
  "success": false,
  "message": "Validation failed",
  "code": "VALIDATION_ERROR",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    },
    {
      "field": "password",
      "message": "Password must be at least 8 characters"
    }
  ]
}
```

# Not Found Response

```json
{
  "success": false,
  "message": "User not found",
  "code": "NOT_FOUND",
  "errors": []
}
```

# Unauthorized Response

```json
{
  "success": false,
  "message": "Invalid or expired token",
  "code": "UNAUTHORIZED",
  "errors": []
}
```

---

# 3. Pagination Strategy

# 3.1 Cursor Pagination (Recommended)

Dùng cho large datasets, hiệu quả hơn với database lớn.

# Request

```txt
GET /api/v1/vocabularies?cursor=<base64_cursor>&limit=20
```

# Response

```json
{
  "success": true,
  "data": [],
  "meta": {
    "pagination": {
      "hasNextPage": true,
      "hasPrevPage": false,
      "startCursor": "base64_cursor",
      "endCursor": "base64_cursor",
      "total": 1000
    }
  }
}
```

# Implementation Example

```typescript
// Backend - Controller
@Get()
async getVocabularies(
  @Query('cursor') cursor?: string,
  @Query('limit') limit: number = 20,
) {
  const result = await this.vocabularyService.findAll({
    cursor: cursor ? decodeCursor(cursor) : undefined,
    limit: Math.min(limit, 100),
  });

  return {
    success: true,
    data: result.data,
    meta: {
      pagination: {
        hasNextPage: result.hasNextPage,
        hasPrevPage: result.hasPrevPage,
        startCursor: encodeCursor(result.startCursor),
        endCursor: encodeCursor(result.endCursor),
      },
    },
  };
}
```

---

# 3.2 Offset Pagination

Dùng cho small datasets hoặc khi cần random access.

# Request

```txt
GET /api/v1/vocabularies?page=1&limit=20
```

# Response

```json
{
  "success": true,
  "data": [],
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}
```

---

# 4. Filtering & Sorting

# 4.1 Filter Parameters

```txt
GET /api/v1/vocabularies?topic=toeic&difficulty=2&status=active
```

# Filter Operators

```txt
GET /api/v1/vocabularies?difficulty[gte]=2&difficulty[lte]=4
GET /api/v1/users?email[contains]=@example.com
GET /api/v1/vocabularies?createdAt[gte]=2024-01-01
```

# Supported Operators

| Operator | Description | Example |
|----------|-------------|---------|
| `eq` | Equals | `status=active` or `status[eq]=active` |
| `neq` | Not equals | `status[neq]=inactive` |
| `gt` | Greater than | `difficulty[gt]=2` |
| `gte` | Greater than or equal | `difficulty[gte]=2` |
| `lt` | Less than | `difficulty[lt]=5` |
| `lte` | Less than or equal | `difficulty[lte]=4` |
| `contains` | Contains substring | `name[contains]=hello` |
| `in` | In array | `status[in]=active,inactive` |
| `nin` | Not in array | `status[nin]=deleted,banned` |

---

# 4.2 Sort Parameters

```txt
GET /api/v1/vocabularies?sort=word
GET /api/v1/vocabularies?sort=-word
GET /api/v1/vocabularies?sort=difficulty,-createdAt
```

# Sort Format

| Format | Description | Example |
|--------|-------------|---------|
| `field` | Ascending | `sort=word` |
| `-field` | Descending | `sort=-word` |

---

# 4.3 Combined Example

```txt
GET /api/v1/vocabularies?topic=toeic&difficulty[gte]=2&sort=-createdAt&limit=10&page=1
```

---

# 5. API Endpoints

# 5.1 Authentication

# Auth APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | Login user |
| POST | `/auth/logout` | Logout user |
| POST | `/auth/refresh` | Refresh access token |
| POST | `/auth/forgot-password` | Request password reset |
| POST | `/auth/reset-password` | Reset password |
| POST | `/auth/verify-email` | Verify email |
| GET | `/auth/me` | Get current user |

# POST /auth/register

# Request

```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "fullName": "John Doe"
}
```

# Response (201)

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "fullName": "John Doe"
  }
}
```

---

# POST /auth/login

# Request

```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

# Response (200)

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "fullName": "John Doe",
      "avatarUrl": "https://...",
      "xp": 100,
      "streakDays": 5
    },
    "accessToken": "jwt_access_token",
    "expiresIn": 900
  }
}
```

---

# POST /auth/refresh

# Request

```json
{
  "refreshToken": "refresh_token"
}
```

# Response (200)

```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "new_jwt_access_token",
    "expiresIn": 900
  }
}
```

---

# 5.2 Users

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/users/me` | Get current user profile |
| PATCH | `/users/me` | Update current user profile |
| GET | `/users/:id` | Get user by ID |
| GET | `/users` | List users (admin) |
| PATCH | `/users/:id` | Update user (admin) |
| DELETE | `/users/:id` | Delete user (admin) |

# GET /users/me

# Response (200)

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "fullName": "John Doe",
    "avatarUrl": "https://...",
    "xp": 1500,
    "streakDays": 15,
    "level": 5,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

# PATCH /users/me

# Request

```json
{
  "fullName": "Jane Doe",
  "avatarUrl": "https://..."
}
```

# Response (200)

```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "fullName": "Jane Doe",
    "avatarUrl": "https://..."
  }
}
```

---

# 5.3 Vocabulary

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/vocabularies` | List vocabularies |
| GET | `/vocabularies/:id` | Get vocabulary detail |
| POST | `/vocabularies` | Create vocabulary |
| PATCH | `/vocabularies/:id` | Update vocabulary |
| DELETE | `/vocabularies/:id` | Delete vocabulary |

# GET /vocabularies

# Query Parameters

```txt
?topic=toeic&difficulty=2&search=hello&page=1&limit=20
```

# Response (200)

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "word": "hello",
      "pronunciation": "/həˈloʊ/",
      "meaning": "xin chào",
      "example": "Hello, how are you?",
      "difficulty": 2,
      "topic": {
        "id": "uuid",
        "name": "TOEIC",
        "slug": "toeic"
      }
    }
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1000,
      "totalPages": 50
    }
  }
}
```

---

# GET /vocabularies/:id

# Response (200)

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "word": "hello",
    "pronunciation": "/həˈloʊ/",
    "meaning": "xin chào",
    "example": "Hello, how are you?",
    "imageUrl": "https://...",
    "audioUrl": "https://...",
    "difficulty": 2,
    "topic": {
      "id": "uuid",
      "name": "TOEIC",
      "slug": "toeic"
    },
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

# POST /vocabularies

# Request

```json
{
  "word": "goodbye",
  "pronunciation": "/ɡʊdˈbaɪ/",
  "meaning": "tạm biệt",
  "example": "Goodbye, see you later!",
  "difficulty": 2,
  "topicId": "uuid",
  "imageUrl": "https://...",
  "audioUrl": "https://..."
}
```

# Response (201)

```json
{
  "success": true,
  "message": "Vocabulary created successfully",
  "data": {
    "id": "uuid",
    "word": "goodbye",
    "pronunciation": "/ɡʊdˈbaɪ/",
    "meaning": "tạm biệt",
    "example": "Goodbye, see you later!",
    "difficulty": 2,
    "topicId": "uuid",
    "imageUrl": "https://...",
    "audioUrl": "https://..."
  }
}
```

---

# PATCH /vocabularies/:id

# Request

```json
{
  "meaning": "chào tạm biệt",
  "difficulty": 3
}
```

# Response (200)

```json
{
  "success": true,
  "message": "Vocabulary updated successfully",
  "data": {
    "id": "uuid",
    "word": "goodbye",
    "meaning": "chào tạm biệt",
    "difficulty": 3
  }
}
```

---

# DELETE /vocabularies/:id

# Response (200)

```json
{
  "success": true,
  "message": "Vocabulary deleted successfully"
}
```

---

# 5.4 Flashcards

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/flashcards/due` | Get due flashcards |
| POST | `/flashcards/review` | Submit review result |
| GET | `/flashcards/stats` | Get flashcard statistics |
| GET | `/flashcards/progress` | Get learning progress |

# GET /flashcards/due

# Query Parameters

```txt
?limit=20
```

# Response (200)

```json
{
  "success": true,
  "data": {
    "cards": [
      {
        "id": "uuid",
        "flashcardId": "uuid",
        "frontContent": "hello",
        "backContent": "xin chào",
        "audioUrl": "https://...",
        "vocabulary": {
          "word": "hello",
          "pronunciation": "/həˈloʊ/"
        }
      }
    ],
    "totalDue": 50,
    "studiedToday": 10
  }
}
```

---

# POST /flashcards/review

# Request

```json
{
  "flashcardId": "uuid",
  "result": "good"
}
```

# Result Values

| Value | Description |
|-------|-------------|
| `again` | Forgot completely |
| `hard` | Difficult recall |
| `good` | Normal recall |
| `easy` | Easy recall |

# Response (200)

```json
{
  "success": true,
  "message": "Review recorded successfully",
  "data": {
    "nextReviewAt": "2024-01-02T00:00:00.000Z",
    "intervalDays": 4,
    "easeFactor": 2.6,
    "xpEarned": 10
  }
}
```

---

# GET /flashcards/stats

# Response (200)

```json
{
  "success": true,
  "data": {
    "totalCards": 500,
    "masteredCards": 150,
    "learningCards": 200,
    "newCards": 150,
    "accuracyRate": 0.85,
    "streak": 15,
    "todayReviewed": 50,
    "weeklyReviewed": 300
  }
}
```

---

# 5.5 Quizzes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/quizzes` | List quizzes |
| GET | `/quizzes/:id` | Get quiz detail |
| POST | `/quizzes/:id/start` | Start quiz attempt |
| POST | `/quizzes/:id/submit` | Submit quiz answers |
| GET | `/quizzes/history` | Get quiz history |

# GET /quizzes

# Query Parameters

```txt
?lessonId=uuid&type=multiple_choice&page=1&limit=10
```

# Response (200)

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "TOEIC Reading Test 1",
      "type": "multiple_choice",
      "questionCount": 50,
      "durationMinutes": 75,
      "difficulty": 3,
      "lesson": {
        "id": "uuid",
        "title": "TOEIC Lesson 1"
      }
    }
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 20,
      "totalPages": 2
    }
  }
}
```

---

# POST /quizzes/:id/start

# Response (200)

```json
{
  "success": true,
  "message": "Quiz started",
  "data": {
    "attemptId": "uuid",
    "startedAt": "2024-01-01T00:00:00.000Z",
    "expiresAt": "2024-01-01T01:15:00.000Z",
    "questions": [
      {
        "id": "uuid",
        "question": "What is the meaning of 'hello'?",
        "options": ["A", "B", "C", "D"],
        "orderIndex": 1
      }
    ]
  }
}
```

---

# POST /quizzes/:id/submit

# Request

```json
{
  "attemptId": "uuid",
  "answers": [
    { "questionId": "uuid1", "answer": "A" },
    { "questionId": "uuid2", "answer": "B" }
  ]
}
```

# Response (200)

```json
{
  "success": true,
  "message": "Quiz submitted successfully",
  "data": {
    "score": 85,
    "correctCount": 42,
    "totalQuestions": 50,
    "timeSpent": 3600,
    "completedAt": "2024-01-01T01:00:00.000Z",
    "xpEarned": 100,
    "correctAnswers": [
      { "questionId": "uuid1", "correct": true },
      { "questionId": "uuid2", "correct": false }
    ]
  }
}
```

---

# 5.6 Topics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/topics` | List all topics |
| GET | `/topics/:id` | Get topic detail |
| GET | `/topics/:slug/slug` | Get topic by slug |
| POST | `/topics` | Create topic |
| PATCH | `/topics/:id` | Update topic |
| DELETE | `/topics/:id` | Delete topic |

# GET /topics

# Response (200)

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "TOEIC",
      "slug": "toeic",
      "description": "TOEIC vocabulary",
      "vocabularyCount": 500,
      "imageUrl": "https://..."
    }
  ]
}
```

---

# 5.7 Progress

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/progress/stats` | Get overall stats |
| GET | `/progress/daily` | Get daily progress |
| GET | `/progress/achievements` | Get achievements |
| GET | `/progress/calendar` | Get study calendar |

# GET /progress/stats

# Response (200)

```json
{
  "success": true,
  "data": {
    "totalXp": 5000,
    "level": 10,
    "xpToNextLevel": 500,
    "currentStreak": 15,
    "longestStreak": 30,
    "totalWordsLearned": 300,
    "totalQuizzesTaken": 50,
    "averageAccuracy": 0.82,
    "totalStudyMinutes": 3600
  }
}
```

---

# GET /progress/daily

# Query Parameters

```txt
?startDate=2024-01-01&endDate=2024-01-31
```

# Response (200)

```json
{
  "success": true,
  "data": [
    {
      "date": "2024-01-01",
      "xpEarned": 100,
      "wordsLearned": 10,
      "quizzesCompleted": 2,
      "studyMinutes": 30
    }
  ]
}
```

---

# 5.8 Leaderboard

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/leaderboard` | Get global leaderboard |
| GET | `/leaderboard/weekly` | Get weekly leaderboard |
| GET | `/leaderboard/monthly` | Get monthly leaderboard |
| GET | `/leaderboard/me` | Get current user rank |

# GET /leaderboard

# Query Parameters

```txt
?period=weekly&limit=100
```

# Response (200)

```json
{
  "success": true,
  "data": {
    "rankings": [
      {
        "rank": 1,
        "userId": "uuid",
        "userName": "John Doe",
        "avatarUrl": "https://...",
        "xp": 5000,
        "level": 15
      }
    ],
    "currentUserRank": 42,
    "period": "weekly",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

# 5.9 Admin APIs

# Users Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/users` | List all users |
| PATCH | `/admin/users/:id` | Update user |
| DELETE | `/admin/users/:id` | Delete user |
| PATCH | `/admin/users/:id/role` | Update user role |

# Vocabularies Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/admin/vocabularies/bulk` | Bulk import vocabularies |
| DELETE | `/admin/vocabularies/bulk` | Bulk delete vocabularies |

# Analytics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/analytics/overview` | Get platform overview |
| GET | `/admin/analytics/users` | Get user analytics |
| GET | `/admin/analytics/learning` | Get learning analytics |

---

# 6. Rate Limiting

# Rate Limit Headers

```txt
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

# Endpoint Rate Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/auth/login` | 5 | per minute |
| `/auth/register` | 3 | per hour |
| `/auth/refresh` | 20 | per minute |
| `/vocabularies` | 100 | per minute |
| `/flashcards/due` | 30 | per minute |
| `/flashcards/review` | 60 | per minute |
| `/quizzes/:id/submit` | 10 | per minute |
| `/ai/*` | 10 | per minute |

---

# 7. Implementation Guidelines

# 7.1 Backend Implementation

# NestJS Response Wrapper

```typescript
// common/response.interceptor.ts
@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map(data => ({
        success: true,
        message: 'Success',
        data,
      })),
    );
  }
}
```

# Error Filter

```typescript
// common/exceptions/http-exception.filter.ts
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    // Format error response
    response.status(400).json({
      success: false,
      message: 'Validation failed',
      code: 'VALIDATION_ERROR',
      errors: [],
    });
  }
}
```

---

# 7.2 Frontend Implementation

# Axios Interceptor

```typescript
// lib/api.ts
export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

api.interceptors.response.use(
  response => response.data,
  async error => {
    if (error.response?.status === 401) {
      // Handle token refresh
      const refreshed = await refreshToken();
      if (refreshed) {
        // Retry original request
        error.config.headers.Authorization = `Bearer ${refreshed}`;
        return api.request(error.config);
      }
    }
    return Promise.reject(error.response?.data);
  }
);
```

---

# 8. Best Practices

# Do

- Sử dụng cursor pagination cho large datasets
- Validate input ở cả frontend và backend
- Return appropriate HTTP status codes
- Log errors với request IDs
- Cache paginated responses
- Use optimistic updates for better UX

# Don't

- Return sensitive data in responses
- Use offset pagination for large tables
- Expose internal error details to clients
- Skip validation on backend
- Return 200 for all errors
- Use snake_case in JavaScript code

---

# 9. Checklist

- [ ] Standard response wrapper
- [ ] Error response format
- [ ] Pagination implementation
- [ ] Filter & sort support
- [ ] Rate limiting
- [ ] API versioning strategy
- [ ] Documentation with examples
- [ ] Frontend API layer
- [ ] Error handling
- [ ] Request validation

---

# 10. Revision History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2024-01-01 | Initial version |
