# Frontend Implementation Roadmap - English Learning Platform

# Mục tiêu

Tài liệu này mô tả chi tiết roadmap triển khai frontend cho hệ thống học tiếng Anh production-ready.

Mục tiêu:

- UI/UX hiện đại
- Responsive
- Scale tốt
- Dễ maintain
- Dễ mở rộng feature
- Hỗ trợ realtime
- Tối ưu performance
- SEO friendly
- Production-ready

---

# 1. Tech Stack Frontend

| Thành phần | Công nghệ |
|---|---|
| Framework | Next.js |
| Language | TypeScript |
| Styling | Tailwind CSS |
| State Management | Zustand |
| Server State | React Query |
| Forms | React Hook Form |
| Validation | Zod |
| Icons | Lucide React |
| Animation | Framer Motion |
| Charts | Recharts |
| Realtime | Socket.io Client |
| UI Components | shadcn/ui |

---

# 2. Kiến trúc Frontend

# App Router Architecture

```txt
Next.js App Router
       |
---------------------------------
| Server Components | Client Components |
---------------------------------
       |
API Layer
       |
NestJS Backend
```

---

# 3. Folder Structure

```txt
src/
 ├── app/
 │    ├── (auth)/
 │    │    ├── login/
 │    │    ├── register/
 │    │    └── forgot-password/
 │    │
 │    ├── dashboard/
 │    ├── vocabulary/
 │    ├── flashcards/
 │    ├── quizzes/
 │    ├── grammar/
 │    ├── speaking/
 │    ├── leaderboard/
 │    ├── settings/
 │    └── admin/
 │
 ├── components/
 │    ├── ui/
 │    ├── common/
 │    ├── layouts/
 │    ├── forms/
 │    ├── charts/
 │    ├── flashcards/
 │    ├── quizzes/
 │    └── dashboard/
 │
 ├── features/
 │    ├── auth/
 │    ├── vocabulary/
 │    ├── flashcards/
 │    ├── quizzes/
 │    ├── grammar/
 │    ├── speaking/
 │    └── analytics/
 │
 ├── hooks/
 ├── services/
 ├── stores/
 ├── lib/
 ├── utils/
 ├── constants/
 ├── types/
 └── styles/
```

---

# 4. Frontend Architecture Principles

# Feature-based Architecture

Không tổ chức theo:

```txt
pages
components
services
```

quá lớn.

---

# Tổ chức theo feature

```txt
features/
 ├── flashcards/
 │    ├── api/
 │    ├── hooks/
 │    ├── components/
 │    ├── types/
 │    └── stores/
```

---

# 5. UI Design System

# Color System

## Primary

```txt
Blue / Indigo
```

## Success

```txt
Green
```

## Error

```txt
Red
```

## Warning

```txt
Orange
```

---

# Typography

## Heading

```txt
font-bold
tracking-tight
```

## Body

```txt
text-gray-700
leading-relaxed
```

---

# Spacing System

```txt
4px
8px
12px
16px
24px
32px
```

---

# 6. Layout Architecture

# Public Layout

```txt
Navbar
Hero
Footer
```

---

# Dashboard Layout

```txt
Sidebar
Topbar
Main Content
```

---

# Admin Layout

```txt
Admin Sidebar
Admin Header
Admin Content
```

---

# 7. Authentication Frontend

# Auth Flow

```txt
Login
  |
Save Tokens
  |
Fetch User Profile
  |
Store User State
  |
Redirect Dashboard
```

---

# Protected Routes

```txt
middleware.ts
```

Ví dụ:

```ts
if (!accessToken) {
  redirect('/login');
}
```

---

# 8. API Layer Architecture

# services/api.ts

```ts
import axios from 'axios';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});
```

---

# Axios Interceptor

```txt
Attach access token
Refresh token automatically
Handle unauthorized
```

---

# 9. React Query Architecture

# Query Keys

```ts
['user-profile']
['flashcards-due']
['quiz-detail', id]
['leaderboard']
```

---

# Cache Strategy

| Data | Cache Time |
|---|---|
| User profile | 10m |
| Leaderboard | 5m |
| Flashcards | 1m |
| Grammar lesson | 1h |

---

# Mutation Strategy

```txt
Optimistic updates
Invalidate queries
Background refetch
```

---

# 10. Zustand Store Design

# Auth Store

```ts
type AuthStore = {
  user: User | null;
  accessToken: string | null;
  setUser: (user: User) => void;
  logout: () => void;
};
```

---

# Flashcard Session Store

```ts
type FlashcardSessionStore = {
  currentCard: Flashcard | null;
  queue: Flashcard[];
  correct: number;
  wrong: number;
};
```

---

# 11. Flashcard UI Architecture

# Flashcard Learning Flow

```txt
Load Due Cards
      |
Start Session
      |
Show Front Card
      |
Flip Card
      |
Rate Difficulty
      |
Move Next Card
```

---

# Flashcard Components

```txt
FlashcardContainer
FlashcardFront
FlashcardBack
DifficultyButtons
SessionProgress
```

---

# Flashcard Modes

## Basic Flip

```txt
Front -> Back
```

---

## Typing Mode

```txt
User type answer
```

---

## Listening Mode

```txt
Play audio
Guess word
```

---

## Speaking Mode

```txt
Record pronunciation
```

---

# 12. Quiz UI Architecture

# Quiz Flow

```txt
Start Quiz
   |
Question Navigation
   |
Answer Questions
   |
Submit Quiz
   |
Show Result
```

---

# Quiz Components

```txt
QuizHeader
QuestionCard
AnswerOptions
QuizNavigation
QuizTimer
QuizResult
```

---

# 13. Speaking UI Architecture

# Speaking Flow

```txt
Start Recording
   |
Upload Audio
   |
Processing
   |
Receive AI Feedback
   |
Show Pronunciation Score
```

---

# Components

```txt
RecorderButton
WaveVisualizer
TranscriptViewer
PronunciationScore
AIFeedbackCard
```

---

# 14. Dashboard UI

# Dashboard Widgets

```txt
Daily XP
Learning Streak
Words Learned
Quiz Accuracy
Leaderboard
Continue Learning
```

---

# Charts

```txt
Weekly Activity
Monthly Progress
Accuracy Trend
```

---

# 15. Realtime Architecture

# WebSocket Use Cases

- realtime leaderboard
- notifications
- live classroom
- speaking room

---

# Socket Structure

```txt
lib/socket.ts
hooks/useSocket.ts
```

---

# Example

```ts
socket.on('leaderboard-update', data => {
  updateLeaderboard(data);
});
```

---

# 16. Form Architecture

# React Hook Form + Zod

## Example

```ts
const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});
```

---

# Form Components

```txt
TextInput
PasswordInput
SelectInput
FileUpload
Textarea
```

---

# 17. Animation Architecture

# Framer Motion

## Use Cases

- flashcard flip
- page transition
- modal animation
- progress animation
- loading skeleton

---

# Example

```txt
Flashcard flip animation
```

---

# 18. Responsive Design

# Breakpoints

```txt
mobile
tablet
desktop
wide screen
```

---

# Mobile-first

```txt
Tailwind responsive utilities
```

---

# 19. SEO Strategy

# SEO Pages

- homepage
- grammar lessons
- blog
- public courses

---

# Dynamic Metadata

```ts
export async function generateMetadata() {}
```

---

# Open Graph

```txt
facebook preview
zalo preview
twitter preview
```

---

# 20. Performance Optimization

# Lazy Loading

```txt
Dynamic imports
```

---

# Image Optimization

```txt
next/image
```

---

# Memoization

```txt
useMemo
useCallback
memo
```

---

# Virtualization

Dùng cho:

```txt
large vocabulary list
leaderboard
```

---

# 21. Error Handling

# Global Error Boundary

```txt
React Error Boundary
```

---

# API Error Handling

```txt
toast notifications
form validation errors
retry mechanism
```

---

# 22. Notification System

# Toast Notifications

Ví dụ:

```txt
Success
Error
Warning
Info
```

---

# Notification Center

```txt
Unread notifications
Realtime updates
```

---

# 23. Dark Mode

# Theme Architecture

```txt
light mode
dark mode
system mode
```

---

# Tailwind Dark Mode

```txt
class strategy
```

---

# 24. Admin Frontend

# Admin Features

- manage users
- manage lessons
- manage flashcards
- manage quizzes
- analytics dashboard

---

# Admin Components

```txt
DataTable
Filters
Pagination
SearchBar
Charts
```

---

# 25. Data Table Architecture

# Features

- sorting
- filtering
- pagination
- bulk actions
- export CSV

---

# Suitable Libraries

```txt
TanStack Table
```

---

# 26. Analytics Frontend

# Dashboard Metrics

```txt
daily active users
quiz completion
accuracy
retention
study time
```

---

# Charts

```txt
Line Chart
Bar Chart
Area Chart
Pie Chart
```

---

# 27. Testing Strategy

# Unit Test

```txt
hooks
utils
stores
```

---

# Component Test

```txt
forms
flashcards
quiz components
```

---

# E2E Test

```txt
login flow
quiz flow
flashcard flow
```

---

# Tools

```txt
Jest
React Testing Library
Playwright
```

---

# 28. Environment Variables

```env
NEXT_PUBLIC_API_URL=
NEXT_PUBLIC_SOCKET_URL=
NEXT_PUBLIC_APP_URL=
```

---

# 29. Deployment Strategy

# Vercel Deployment

```txt
Frontend -> Vercel
Backend -> VPS/Docker
```

---

# CDN Strategy

```txt
Images
Audio
Static Assets
```

---

# 30. CI/CD Frontend

# GitHub Actions

```txt
Push Code
   |
Install Dependencies
   |
Run Lint
   |
Run Tests
   |
Build App
   |
Deploy Vercel
```

---

# 31. Roadmap triển khai Frontend

# Phase 1

## Foundation

- Next.js setup
- Tailwind setup
- shadcn/ui
- Auth pages
- Layout system
- API layer
- Zustand
- React Query

---

# Phase 2

## Learning Features

- Vocabulary pages
- Flashcard system
- Quiz system
- Dashboard
- Progress tracking

---

# Phase 3

## Infrastructure

- Error handling
- Loading states
- Toast notifications
- SEO
- Responsive optimization

---

# Phase 4

## AI Features

- Speaking UI
- AI feedback
- AI flashcards
- AI chatbot

---

# Phase 5

## Scale Features

- WebSocket
- Leaderboard
- Analytics
- Adaptive learning
- Recommendation system

---

# 32. Ưu tiên triển khai

# Làm trước

- Auth
- Dashboard
- Flashcards
- Quiz
- Progress UI

---

# Làm sau

- Speaking
- AI
- Analytics
- Adaptive learning

---

# 33. Best Practices

# Không nhét business logic vào component

Sai:

```txt
Component quá lớn
```

---

# Tách logic

```txt
hooks
services
stores
```

---

# Reusable Components

```txt
Button
Modal
Table
Input
Card
```

---

# Skeleton Loading

Không dùng spinner toàn màn hình.

---

# Accessibility

- keyboard navigation
- aria labels
- focus states

---

# 34. Kết luận

Frontend architecture phù hợp nhất:

```txt
Next.js
Tailwind CSS
React Query
Zustand
shadcn/ui
Framer Motion
```

Kiến trúc này:

- production-ready
- scalable
- SEO friendly
- responsive
- dễ maintain
- phù hợp flashcard system
- phù hợp AI features
- phù hợp realtime
- phù hợp portfolio

