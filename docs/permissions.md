# Permission Matrix - English Learning Platform

# Mục tiêu

Tài liệu này mô tả chi tiết permission matrix cho tất cả roles và resources trong hệ thống.

---

# 1. Role Definitions

# System Roles

| Role | Code | Description |
|------|------|-------------|
| Super Admin | `super_admin` | Full system access, cannot be modified |
| Admin | `admin` | Platform management, user management |
| Content Manager | `content_manager` | Manage learning content |
| Teacher | `teacher` | Create and manage own content |
| Student | `student` | Access learning features |

---

# 2. Permission Matrix

# 2.1 User Management

| Permission | Student | Teacher | Content Manager | Admin | Super Admin |
|------------|---------|---------|-----------------|-------|-------------|
| `user.view_profile` | Own | Own | All | All | All |
| `user.update_profile` | Own | Own | Own | Own | Own |
| `user.view_settings` | Own | Own | All | All | All |
| `user.update_settings` | Own | Own | Own | Own | Own |
| `user.delete` | - | - | - | All | All |
| `user.manage` | - | - | - | All | All |
| `user.export` | - | - | - | All | All |
| `user.view_analytics` | Own | Own | All | All | All |

---

# 2.2 Authentication

| Permission | Student | Teacher | Content Manager | Admin | Super Admin |
|------------|---------|---------|-----------------|-------|-------------|
| `auth.login` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `auth.register` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `auth.logout` | Own | Own | Own | Own | Own |
| `auth.forgot_password` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `auth.reset_password` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `auth.view_sessions` | Own | Own | Own | All | All |
| `auth.revoke_session` | Own | Own | Own | All | All |

---

# 2.3 Vocabulary

| Permission | Student | Teacher | Content Manager | Admin | Super Admin |
|------------|---------|---------|-----------------|-------|-------------|
| `vocabulary.view` | All | All | All | All | All |
| `vocabulary.search` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `vocabulary.create` | - | Own | All | All | All |
| `vocabulary.update` | - | Own | All | All | All |
| `vocabulary.delete` | - | - | All | All | All |
| `vocabulary.import` | - | - | All | All | All |
| `vocabulary.export` | - | - | All | All | All |

---

# 2.4 Flashcards

| Permission | Student | Teacher | Content Manager | Admin | Super Admin |
|------------|---------|---------|-----------------|-------|-------------|
| `flashcard.view` | All | All | All | All | All |
| `flashcard.review` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `flashcard.create` | - | Own | All | All | All |
| `flashcard.update` | - | Own | All | All | All |
| `flashcard.delete` | - | - | All | All | All |
| `flashcard.generate_ai` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `flashcard.view_stats` | Own | Own | All | All | All |

---

# 2.5 Quizzes

| Permission | Student | Teacher | Content Manager | Admin | Super Admin |
|------------|---------|---------|-----------------|-------|-------------|
| `quiz.take` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `quiz.view_results` | Own | Own | All | All | All |
| `quiz.view_history` | Own | Own | All | All | All |
| `quiz.create` | - | Own | All | All | All |
| `quiz.update` | - | Own | All | All | All |
| `quiz.delete` | - | - | All | All | All |
| `quiz.publish` | - | - | All | All | All |
| `quiz.review_answers` | Own | Own | All | All | All |
| `quiz.export_results` | - | Own | All | All | All |
| `quiz.generate_ai` | - | - | All | All | All |

---

# 2.6 Topics

| Permission | Student | Teacher | Content Manager | Admin | Super Admin |
|------------|---------|---------|-----------------|-------|-------------|
| `topic.view` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `topic.create` | - | - | All | All | All |
| `topic.update` | - | - | All | All | All |
| `topic.delete` | - | - | All | All | All |
| `topic.reorder` | - | - | All | All | All |

---

# 2.7 Grammar

| Permission | Student | Teacher | Content Manager | Admin | Super Admin |
|------------|---------|---------|-----------------|-------|-------------|
| `grammar.view` | All | All | All | All | All |
| `grammar.create` | - | - | All | All | All |
| `grammar.update` | - | - | All | All | All |
| `grammar.delete` | - | - | All | All | All |
| `grammar.explain` | ✅ | ✅ | ✅ | ✅ | ✅ |

---

# 2.8 Speaking

| Permission | Student | Teacher | Content Manager | Admin | Super Admin |
|------------|---------|---------|-----------------|-------|-------------|
| `speaking.practice` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `speaking.view_history` | Own | Own | All | All | All |
| `speaking.create_exercise` | - | Own | All | All | All |
| `speaking.update_exercise` | - | Own | All | All | All |
| `speaking.delete_exercise` | - | - | All | All | All |
| `speaking.view_analytics` | Own | Own | All | All | All |

---

# 2.9 Progress & Achievements

| Permission | Student | Teacher | Content Manager | Admin | Super Admin |
|------------|---------|---------|-----------------|-------|-------------|
| `progress.view` | Own | Own | All | All | All |
| `progress.view_leaderboard` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `achievement.view` | Own | Own | All | All | All |
| `achievement.grant` | - | - | - | All | All |

---

# 2.10 Notifications

| Permission | Student | Teacher | Content Manager | Admin | Super Admin |
|------------|---------|---------|-----------------|-------|-------------|
| `notification.view` | Own | Own | Own | Own | Own |
| `notification.mark_read` | Own | Own | Own | Own | Own |
| `notification.send` | - | - | - | All | All |
| `notification.broadcast` | - | - | - | All | All |

---

# 2.11 Admin & Settings

| Permission | Student | Teacher | Content Manager | Admin | Super Admin |
|------------|---------|---------|-----------------|-------|-------------|
| `admin.view_dashboard` | - | - | - | ✅ | ✅ |
| `admin.manage_users` | - | - | - | ✅ | ✅ |
| `admin.manage_content` | - | - | ✅ | ✅ | ✅ |
| `admin.view_analytics` | - | - | - | ✅ | ✅ |
| `admin.export_data` | - | - | - | ✅ | ✅ |
| `admin.manage_settings` | - | - | - | ✅ | ✅ |
| `admin.manage_roles` | - | - | - | - | ✅ |
| `admin.manage_permissions` | - | - | - | - | ✅ |
| `admin.view_logs` | - | - | - | ✅ | ✅ |
| `admin.manage_feature_flags` | - | - | - | - | ✅ |

---

# 2.12 Roles & Permissions Management

| Permission | Student | Teacher | Content Manager | Admin | Super Admin |
|------------|---------|---------|-----------------|-------|-------------|
| `role.view` | - | - | - | - | ✅ |
| `role.create` | - | - | - | - | ✅ |
| `role.update` | - | - | - | - | ✅ |
| `role.delete` | - | - | - | - | ✅ |
| `permission.view` | - | - | - | - | ✅ |
| `permission.assign` | - | - | - | - | ✅ |

---

# 3. Resource-based Permissions

# 3.1 Ownership Model

Some permissions support ownership checking.

| Permission Pattern | Description |
|--------------------|-------------|
| `resource.update.own` | Can only update own resources |
| `resource.update.any` | Can update any resource |
| `resource.delete.own` | Can only delete own resources |
| `resource.delete.any` | Can delete any resource |

# Examples

# Teacher Own Lessons Only

```
teacher.create
lesson.update.own
lesson.delete.own
```

# Admin All Lessons

```
admin
lesson.update.any
lesson.delete.any
```

---

# 3.2 Organization-based Permissions (Future)

For multi-tenant support.

| Permission Pattern | Description |
|--------------------|-------------|
| `resource.view.organization` | View within organization |
| `resource.update.organization` | Update within organization |
| `resource.create.organization` | Create within organization |

---

# 4. Permission Hierarchy

# Implicit Permissions

```txt
super_admin
  └── admin
        └── content_manager
              └── teacher
                    └── student
```

# Inheritance Rules

| Parent Role | Implicit Permissions |
|-------------|---------------------|
| super_admin | All permissions |
| admin | All admin permissions + content_manager |
| content_manager | All content permissions + teacher |
| teacher | Own content permissions + student |
| student | Basic learning permissions |

---

# 5. API Permission Requirements

# 5.1 Auth Module

| Endpoint | Required Permission |
|----------|--------------------|
| POST /auth/login | `auth.login` |
| POST /auth/register | `auth.register` |
| POST /auth/logout | `auth.logout` |
| POST /auth/refresh | - (refresh token) |
| GET /auth/me | Authenticated |

---

# 5.2 Users Module

| Endpoint | Required Permission |
|----------|--------------------|
| GET /users/me | Authenticated |
| PATCH /users/me | `user.update_profile` |
| GET /users/:id | `user.view_profile` |
| GET /admin/users | `admin.manage_users` |
| PATCH /admin/users/:id | `admin.manage_users` |
| DELETE /admin/users/:id | `user.delete` |

---

# 5.3 Vocabulary Module

| Endpoint | Required Permission |
|----------|--------------------|
| GET /vocabularies | `vocabulary.view` |
| GET /vocabularies/:id | `vocabulary.view` |
| POST /vocabularies | `vocabulary.create` |
| PATCH /vocabularies/:id | `vocabulary.update` |
| DELETE /vocabularies/:id | `vocabulary.delete` |
| POST /vocabularies/bulk | `vocabulary.import` |

---

# 5.4 Flashcard Module

| Endpoint | Required Permission |
|----------|--------------------|
| GET /flashcards/due | `flashcard.view` |
| POST /flashcards/review | `flashcard.review` |
| GET /flashcards/stats | `flashcard.view_stats` |
| POST /flashcards/generate-ai | `flashcard.generate_ai` |
| POST /flashcards | `flashcard.create` |
| PATCH /flashcards/:id | `flashcard.update` |
| DELETE /flashcards/:id | `flashcard.delete` |

---

# 5.5 Quiz Module

| Endpoint | Required Permission |
|----------|--------------------|
| GET /quizzes | `quiz.take` |
| GET /quizzes/:id | `quiz.take` |
| POST /quizzes/:id/start | `quiz.take` |
| POST /quizzes/:id/submit | `quiz.take` |
| GET /quizzes/history | `quiz.view_history` |
| POST /quizzes | `quiz.create` |
| PATCH /quizzes/:id | `quiz.update` |
| DELETE /quizzes/:id | `quiz.delete` |
| POST /quizzes/:id/publish | `quiz.publish` |

---

# 5.6 Progress Module

| Endpoint | Required Permission |
|----------|--------------------|
| GET /progress/stats | `progress.view` |
| GET /progress/daily | `progress.view` |
| GET /progress/achievements | `achievement.view` |
| GET /leaderboard | `progress.view_leaderboard` |

---

# 5.7 Admin Module

| Endpoint | Required Permission |
|----------|--------------------|
| GET /admin/dashboard | `admin.view_dashboard` |
| GET /admin/analytics | `admin.view_analytics` |
| GET /admin/users | `admin.manage_users` |
| PATCH /admin/users/:id | `admin.manage_users` |
| GET /admin/roles | `role.view` |
| POST /admin/roles | `role.create` |
| PATCH /admin/roles/:id | `role.update` |
| DELETE /admin/roles/:id | `role.delete` |
| POST /admin/roles/:id/permissions | `permission.assign` |

---

# 6. Frontend Permission Guards

# 6.1 Route Guards

```typescript
// middleware.ts
const protectedRoutes = [
  { path: '/dashboard', permissions: ['progress.view'] },
  { path: '/admin', permissions: ['admin.view_dashboard'] },
  { path: '/vocabulary/create', permissions: ['vocabulary.create'] },
];

export function checkRoutePermission(route: string, userPermissions: string[]) {
  const protectedRoute = protectedRoutes.find(r =>
    route.startsWith(r.path)
  );

  if (!protectedRoute) return true;

  return protectedRoute.permissions.every(p =>
    userPermissions.includes(p)
  );
}
```

---

# 6.2 Component Guards

```typescript
// hooks/usePermission.ts
export function usePermission(permission: string) {
  const { user } = useAuth();

  return {
    hasPermission: user?.permissions?.includes(permission) ?? false,
    isLoading: !user,
  };
}

// Usage
function CreateVocabularyButton() {
  const { hasPermission } = usePermission('vocabulary.create');

  if (!hasPermission) return null;

  return <Button>Create Vocabulary</Button>;
}
```

---

# 6.3 API Permission Middleware

```typescript
// NestJS Permission Guard
@Injectable()
export class PermissionGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    const requiredPermissions = this.reflector.get<string[]>(
      'permissions',
      context.getHandler(),
    );

    if (!requiredPermissions?.length) {
      return true;
    }

    return requiredPermissions.every(permission =>
      user.permissions?.includes(permission),
    );
  }
}

// Usage
@Get()
@UseGuards(AuthGuard, PermissionGuard)
@SetMetadata('permissions', ['vocabulary.view'])
async getVocabularies() {}
```

---

# 7. Database Schema

# Permissions Table

```sql
CREATE TABLE permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  resource VARCHAR(100) NOT NULL,
  action VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_permissions_code ON permissions(code);
CREATE INDEX idx_permissions_resource ON permissions(resource);
```

# Roles Table

```sql
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  code VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  is_system BOOLEAN DEFAULT FALSE,
  priority INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

# User Roles Table

```sql
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  role_id UUID NOT NULL REFERENCES roles(id),
  organization_id UUID REFERENCES organizations(id),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, role_id, organization_id)
);
```

# Role Permissions Table

```sql
CREATE TABLE role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES roles(id),
  permission_id UUID NOT NULL REFERENCES permissions(id),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(role_id, permission_id)
);
```

---

# 8. Seed Data

# Default Permissions

```typescript
const permissions = [
  // User
  { code: 'user.view_profile', resource: 'user', action: 'view_profile' },
  { code: 'user.update_profile', resource: 'user', action: 'update_profile' },
  { code: 'user.delete', resource: 'user', action: 'delete' },
  { code: 'user.manage', resource: 'user', action: 'manage' },

  // Vocabulary
  { code: 'vocabulary.view', resource: 'vocabulary', action: 'view' },
  { code: 'vocabulary.create', resource: 'vocabulary', action: 'create' },
  { code: 'vocabulary.update', resource: 'vocabulary', action: 'update' },
  { code: 'vocabulary.delete', resource: 'vocabulary', action: 'delete' },

  // Flashcard
  { code: 'flashcard.view', resource: 'flashcard', action: 'view' },
  { code: 'flashcard.review', resource: 'flashcard', action: 'review' },
  { code: 'flashcard.create', resource: 'flashcard', action: 'create' },
  { code: 'flashcard.update', resource: 'flashcard', action: 'update' },
  { code: 'flashcard.delete', resource: 'flashcard', action: 'delete' },

  // Quiz
  { code: 'quiz.take', resource: 'quiz', action: 'take' },
  { code: 'quiz.view_results', resource: 'quiz', action: 'view_results' },
  { code: 'quiz.create', resource: 'quiz', action: 'create' },
  { code: 'quiz.update', resource: 'quiz', action: 'update' },
  { code: 'quiz.delete', resource: 'quiz', action: 'delete' },
  { code: 'quiz.publish', resource: 'quiz', action: 'publish' },

  // Progress
  { code: 'progress.view', resource: 'progress', action: 'view' },
  { code: 'progress.view_leaderboard', resource: 'progress', action: 'view_leaderboard' },

  // Admin
  { code: 'admin.view_dashboard', resource: 'admin', action: 'view_dashboard' },
  { code: 'admin.manage_users', resource: 'admin', action: 'manage_users' },
  { code: 'admin.view_analytics', resource: 'admin', action: 'view_analytics' },
  { code: 'admin.manage_settings', resource: 'admin', action: 'manage_settings' },

  // Role Management
  { code: 'role.view', resource: 'role', action: 'view' },
  { code: 'role.create', resource: 'role', action: 'create' },
  { code: 'role.update', resource: 'role', action: 'update' },
  { code: 'role.delete', resource: 'role', action: 'delete' },
];
```

# Default Roles

```typescript
const roles = [
  {
    name: 'Super Admin',
    code: 'super_admin',
    description: 'Full system access',
    is_system: true,
    priority: 100,
    permissions: ['*'], // All permissions
  },
  {
    name: 'Admin',
    code: 'admin',
    description: 'Platform administrator',
    is_system: true,
    priority: 80,
    permissions: [
      'user.view_profile', 'user.update_profile', 'user.delete', 'user.manage',
      'vocabulary.*',
      'flashcard.*',
      'quiz.*',
      'progress.*',
      'admin.view_dashboard', 'admin.manage_users', 'admin.view_analytics',
      'notification.send',
    ],
  },
  {
    name: 'Content Manager',
    code: 'content_manager',
    description: 'Manages learning content',
    is_system: true,
    priority: 60,
    permissions: [
      'user.view_profile',
      'vocabulary.*',
      'flashcard.*',
      'quiz.*',
      'topic.*',
      'grammar.*',
      'speaking.*',
      'progress.view',
      'admin.manage_content',
    ],
  },
  {
    name: 'Teacher',
    code: 'teacher',
    description: 'Creates and manages own content',
    is_system: true,
    priority: 40,
    permissions: [
      'user.view_profile',
      'vocabulary.view',
      'flashcard.view', 'flashcard.review',
      'quiz.take', 'quiz.view_results',
      'grammar.view', 'grammar.explain',
      'speaking.practice', 'speaking.view_history',
      'progress.view',
    ],
  },
  {
    name: 'Student',
    code: 'student',
    description: 'Basic learning access',
    is_system: true,
    priority: 20,
    permissions: [
      'user.view_profile', 'user.update_profile',
      'auth.*',
      'vocabulary.view', 'vocabulary.search',
      'flashcard.view', 'flashcard.review',
      'quiz.take', 'quiz.view_results', 'quiz.view_history',
      'grammar.view', 'grammar.explain',
      'speaking.practice', 'speaking.view_history',
      'progress.view', 'progress.view_leaderboard',
      'achievement.view',
    ],
  },
];
```

---

# 9. Audit Log

Track permission-related actions for security.

```typescript
// Audit Events
const permissionAuditEvents = [
  'permission.granted',
  'permission.revoked',
  'role.assigned',
  'role.removed',
  'role.created',
  'role.updated',
  'role.deleted',
];
```

---

# 10. Checklist

- [ ] Permission database tables
- [ ] Role seed data
- [ ] Permission seed data
- [ ] RBAC service
- [ ] Permission guard
- [ ] Permission decorator
- [ ] Cache invalidation
- [ ] Admin UI for permissions
- [ ] Audit logging
- [ ] Unit tests

---

# 11. Revision History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2024-01-01 | Initial version |
