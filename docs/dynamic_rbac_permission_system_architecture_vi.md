# Dynamic RBAC Permission System Architecture - Production Ready

# Mục tiêu

Tài liệu này mô tả chi tiết cách thiết kế và triển khai hệ thống phân quyền động (Dynamic RBAC) cho hệ thống production-ready có khả năng scale lớn.

Mục tiêu:

- phân quyền động
- scalable
- dễ maintain
- hỗ trợ multi-role
- hỗ trợ permission inheritance
- hỗ trợ permission caching
- hỗ trợ organization/team
- production-ready
- phù hợp SaaS architecture

Hệ thống này phù hợp cho:

- LMS
- CRM
- ERP
- English Learning Platform
- SaaS
- Admin systems

---

# 1. Vấn đề của phân quyền hardcode

# Cách làm sai

```ts
if (user.role === 'admin') {}
```

hoặc:

```ts
if (user.role === 'teacher') {}
```

---

# Vấn đề

## Không scale

Khi hệ thống lớn:

```txt
student
teacher
content manager
support
moderator
super admin
organization admin
finance
reviewer
```

→ code sẽ vỡ.

---

# Không dynamic

Không thể:

- thêm permission runtime
- thay đổi permission không cần deploy
- custom role theo organization
- granular permissions

---

# Không phù hợp production

Hệ thống lớn KHÔNG dùng role hardcode.

---

# 2. Kiến trúc phân quyền chuẩn

# RBAC

Role-Based Access Control.

---

# Kiến trúc chuẩn

```txt
User
  |
UserRoles
  |
Role
  |
RolePermissions
  |
Permission
```

---

# Flow

```txt
User Request
      |
Get User Roles
      |
Get Role Permissions
      |
Merge Permissions
      |
Cache Permissions
      |
Authorize Request
```

---

# 3. Permission Strategy

# Permission Granularity

KHÔNG dùng:

```txt
admin
teacher
student
```

làm permission.

---

# Đúng

Permission phải granular.

Ví dụ:

```txt
user.create
user.update
user.delete
user.view

lesson.create
lesson.update
lesson.delete
lesson.publish

quiz.submit
quiz.review

flashcard.review
flashcard.create
```

---

# Naming Convention

Format:

```txt
resource.action
```

Ví dụ:

```txt
course.create
course.update
course.delete
course.publish
```

---

# Benefits

- dễ search
- dễ maintain
- dễ cache
- dễ grouping
- dễ analytics

---

# 4. Database Architecture

# ERD

```txt
users
roles
permissions
user_roles
role_permissions
```

---

# users

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE,
  full_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

# roles

```sql
CREATE TABLE roles (
  id UUID PRIMARY KEY,
  name VARCHAR(100) UNIQUE,
  code VARCHAR(100) UNIQUE,
  description TEXT,
  is_system BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

# permissions

```sql
CREATE TABLE permissions (
  id UUID PRIMARY KEY,
  code VARCHAR(255) UNIQUE,
  description TEXT,
  resource VARCHAR(100),
  action VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

# user_roles

```sql
CREATE TABLE user_roles (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  role_id UUID REFERENCES roles(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

# role_permissions

```sql
CREATE TABLE role_permissions (
  id UUID PRIMARY KEY,
  role_id UUID REFERENCES roles(id),
  permission_id UUID REFERENCES permissions(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

# Index Strategy

```sql
CREATE INDEX idx_user_roles_user_id
ON user_roles(user_id);

CREATE INDEX idx_role_permissions_role_id
ON role_permissions(role_id);

CREATE INDEX idx_permissions_code
ON permissions(code);
```

---

# 5. Dynamic Permission System

# Permission Lookup

Ví dụ:

```txt
lesson.create
```

KHÔNG hardcode.

Lấy từ database.

---

# Permission Resolution Flow

```txt
Get User Roles
      |
Get Role Permissions
      |
Merge Permissions
      |
Deduplicate
      |
Cache
      |
Return Permission Set
```

---

# Example

## Teacher Role

```txt
lesson.create
lesson.update
lesson.view
quiz.review
```

---

## Moderator Role

```txt
comment.delete
user.suspend
report.review
```

---

# User có nhiều role

Ví dụ:

```txt
teacher
moderator
```

→ merge toàn bộ permissions.

---

# 6. NestJS Architecture

# Folder Structure

```txt
modules/
 ├── permissions/
 │    ├── controllers/
 │    ├── services/
 │    ├── repositories/
 │    ├── guards/
 │    ├── decorators/
 │    ├── dto/
 │    ├── entities/
 │    ├── interfaces/
 │    ├── constants/
 │    └── permissions.module.ts
```

---

# Core Components

| Component | Responsibility |
|---|---|
| PermissionGuard | authorize request |
| PermissionDecorator | attach metadata |
| PermissionService | resolve permissions |
| RoleService | manage roles |
| CacheService | permission cache |

---

# 7. Permission Decorator

# Decorator

```ts
export const PERMISSIONS_KEY = 'permissions';

export const Permissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
```

---

# Usage

```ts
@Permissions('lesson.create')
@Post()
createLesson() {}
```

---

# Multiple Permissions

```ts
@Permissions(
  'lesson.create',
  'lesson.publish'
)
```

---

# 8. Permission Guard

# Permission Guard Flow

```txt
Get Route Metadata
      |
Get User Permissions
      |
Compare Permissions
      |
Allow / Deny
```

---

# Guard Example

```ts
@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private permissionService: PermissionService,
  ) {}

  async canActivate(context: ExecutionContext) {
    const requiredPermissions =
      this.reflector.get<string[]>(
        PERMISSIONS_KEY,
        context.getHandler(),
      );

    if (!requiredPermissions?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest();

    const user = request.user;

    const permissions =
      await this.permissionService.getUserPermissions(user.id);

    return requiredPermissions.every(permission =>
      permissions.includes(permission),
    );
  }
}
```

---

# 9. Permission Service

# Responsibility

- resolve permissions
- cache permissions
- invalidate cache
- merge permissions

---

# Flow

```txt
Check Redis Cache
      |
Cache Hit?
   /      \
 Yes      No
  |         |
Return    Query DB
            |
         Build Permission Set
            |
         Save Cache
            |
         Return
```

---

# Example

```ts
async getUserPermissions(userId: string) {
  const cacheKey = `permissions:${userId}`;

  const cached = await this.redis.get(cacheKey);

  if (cached) {
    return JSON.parse(cached);
  }

  const roles = await this.roleRepository.findUserRoles(userId);

  const permissions = mergePermissions(roles);

  await this.redis.set(
    cacheKey,
    JSON.stringify(permissions),
    'EX',
    300,
  );

  return permissions;
}
```

---

# 10. Redis Permission Cache

# Vì sao cần cache

Nếu mỗi request đều query:

```txt
users
roles
permissions
```

→ hệ thống sẽ rất chậm.

---

# Cache Key

```txt
permissions:user_id
```

---

# TTL

```txt
5 phút
```

---

# Cache Invalidation

Khi:

- update role
- add permission
- remove permission
- assign role
- revoke role

→ invalidate cache.

---

# 11. Advanced Permission Model

# Resource-based Permissions

Ví dụ:

```txt
lesson.update.own
lesson.update.any
```

---

# Use Case

## Teacher

Chỉ sửa lesson của mình.

---

## Admin

Sửa mọi lesson.

---

# Ownership Check

```txt
User Request
      |
Has lesson.update.own?
      |
Check ownership
```

---

# 12. Organization-based Permissions

# Multi-tenant Architecture

Ví dụ:

```txt
School A
School B
School C
```

---

# Tables

```txt
organizations
organization_users
organization_roles
```

---

# User Role theo Organization

Ví dụ:

```txt
User A:
- admin ở School A
- teacher ở School B
```

---

# ERD

```txt
users
organizations
roles
permissions
organization_users
organization_user_roles
role_permissions
```

---

# 13. Hierarchical Roles

# Role Inheritance

Ví dụ:

```txt
super_admin
  |
admin
  |
teacher
  |
student
```

---

# Cẩn thận

Role inheritance dễ:

- phức tạp
- khó debug
- khó maintain

---

# Recommendation

Production thực tế:

KHÔNG nên dùng inheritance quá sâu.

---

# 14. Permission Matrix

# Example

| Permission | Student | Teacher | Admin |
|---|---|---|---|
| lesson.view | ✅ | ✅ | ✅ |
| lesson.create | ❌ | ✅ | ✅ |
| lesson.publish | ❌ | ❌ | ✅ |
| quiz.submit | ✅ | ✅ | ✅ |
| user.delete | ❌ | ❌ | ✅ |

---

# 15. Dynamic Admin Panel

# Admin có thể:

- tạo role
- gán permission
- revoke permission
- assign role
- revoke role

KHÔNG cần deploy code.

---

# APIs

```txt
POST /roles
GET /roles
PATCH /roles/:id
DELETE /roles/:id

POST /permissions
GET /permissions

POST /roles/:id/permissions
DELETE /roles/:id/permissions/:permissionId
```

---

# 16. Seeder Strategy

# System Roles

```txt
super_admin
admin
teacher
student
```

---

# System Permissions

```txt
user.create
user.update
lesson.create
lesson.publish
```

---

# Seeder Example

```ts
await prisma.permission.createMany({
  data: permissions,
});
```

---

# 17. Scale Strategy

# Vấn đề khi scale

Ví dụ:

```txt
10 triệu requests/day
```

---

# Bottleneck

## Permission Queries

Nếu không cache:

→ DB overload.

---

# Giải pháp

## Redis Cache

Bắt buộc.

---

## Memory Cache

Optional.

---

## JWT Embedded Permissions

Optional.

---

# 18. JWT Embedded Permissions

# Strategy

Embed permissions vào JWT.

Ví dụ:

```json
{
  "sub": "user-id",
  "permissions": [
    "lesson.create",
    "lesson.update"
  ]
}
```

---

# Benefits

- nhanh
- giảm DB queries

---

# Drawbacks

- token lớn
- revoke khó
- stale permissions

---

# Recommendation

## Small systems

Có thể dùng.

---

## Large systems

Redis cache tốt hơn.

---

# 19. Permission Wildcards

# Example

```txt
lesson.*
```

---

# Ý nghĩa

```txt
lesson.create
lesson.update
lesson.delete
```

---

# Cẩn thận

Wildcard:

- khó debug
- khó audit

---

# Recommendation

Chỉ dùng:

```txt
super_admin
```

---

# 20. Audit Log System

# Track Permission Changes

Ví dụ:

```txt
Admin A granted teacher role to User B
```

---

# Audit Table

```txt
audit_logs
- id
- actor_id
- action
- target_type
- target_id
- metadata
- created_at
```

---

# Track

- role changes
- permission changes
- sensitive actions
- login attempts

---

# 21. Security Best Practices

# Không trust frontend

Frontend chỉ để UI.

Backend phải validate permission.

---

# Không hardcode admin checks

Sai:

```ts
if (user.role === 'admin')
```

---

# Rate Limit Admin APIs

Ví dụ:

```txt
role updates
permission updates
```

---

# Sensitive Permission Approval

Ví dụ:

```txt
super_admin assignment
```

cần approval.

---

# 22. Testing Strategy

# Unit Test

Test:

- permission resolver
- cache invalidation
- wildcard logic

---

# Integration Test

Test:

- route authorization
- multi-role
- organization permissions

---

# E2E Test

Test:

- admin panel
- permission updates
- forbidden routes

---

# Example Cases

## Teacher

```txt
can create lesson
cannot delete user
```

---

## Student

```txt
can review flashcards
cannot publish lessons
```

---

# 23. Observability

# Track Metrics

- permission cache hit
- permission cache miss
- denied requests
- role updates
- permission updates

---

# Alerts

Ví dụ:

```txt
Too many denied requests
```

→ possible attack.

---

# 24. Production Checklist

# Required

- Redis cache
- permission guard
- permission decorator
- audit logs
- rate limit
- tests
- cache invalidation
- admin panel
- logging
- monitoring

---

# Optional

- wildcard permissions
- organization permissions
- hierarchical roles
- JWT embedded permissions

---

# 25. Recommended Architecture

# Best Production Architecture

```txt
NestJS
PostgreSQL
Redis
RBAC
Permission Cache
Audit Logs
Dynamic Admin Panel
```

---

# Final Recommendation

Cho production thực tế:

## Nên dùng

- RBAC dynamic
- granular permissions
- Redis cache
- audit logs
- permission guard
- admin permission management

---

## Không nên

- hardcode roles
- permission inheritance quá sâu
- query DB mỗi request
- trust frontend permissions

---

# Kết luận

Kiến trúc này:

- scalable
- production-ready
- dễ maintain
- hỗ trợ SaaS
- hỗ trợ multi-tenant
- hỗ trợ dynamic permissions
- phù hợp long-term development
- phù hợp enterprise systems

