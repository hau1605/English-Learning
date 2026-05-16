# English Learning Platform

Nền tảng học tiếng Anh với flashcards, quizzes, và luyện nói bằng ghi âm.

## Tính năng chính

### Backend (NestJS + Prisma)

- [x] Xác thực người dùng (Đăng ký, Đăng nhập, Đăng xuất)
- [x] JWT với Refresh Token Rotation
- [x] Quản lý Session đa thiết bị
- [x] Hệ thống RBAC động
- [x] Quản lý Từ vựng
- [x] Hệ thống Flashcard với Spaced Repetition
- [x] Hệ thống Quiz
- [x] Bài học Ngữ pháp
- [x] Luyện nói với ghi âm và lịch sử bài làm
- [x] Analytics & Bảng xếp hạng
- [x] Notifications

## Bắt đầu

### Backend

```bash
cd backend
npm install
cp .env.example .env
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run start:dev
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

## Tài khoản mặc định

| Email | Password | Role |
|-------|----------|------|
| admin@example.com | Admin123! | Super Admin |

## License

MIT
