# Project review and next steps (AI deferred)

Ngay 2026-05-15. Pham vi ra soat: cau truc repo, backend NestJS, frontend Next.js, Prisma schema, Docker/infra, GitHub workflows va cac tai lieu trong `docs/`. Phan lien quan den AI da duoc go khoi code chay; speaking hien xu ly ghi am va luu attempt khong can API key.

## Cap nhat sau trien khai

Da thuc hien:

- Bo module/backend API AI va frontend `/ai`, xoa OpenAI env/dependency/menu seed/copy lien quan.
- Bo phu thuoc OpenAI khoi speaking; speaking upload audio that qua media endpoint va queue chi danh dau attempt da luu.
- Them guard/RBAC cho courses, sections, lessons, media, speaking, leaderboard, progress va queue job status.
- Bo sung route alias lesson de khop frontend: `courses/:courseId/sections/:sectionId/lessons`, `lessons/:id`, `lessons/:id/view`.
- Sua media local storage fallback, static `/uploads`, checksum metadata, signed URL dung `media.fileKey`, delete key co folder path.
- Refresh token da so sanh voi hash trong session truoc khi rotate.
- Queue processors cap nhat `PROCESSING`/`COMPLETED`/`FAILED` va attempts cho email/notification/speaking.
- XP award cap nhat level khi user vuot threshold.
- CI/CD bot placeholder smoke test duoc thay bang `curl /health`; frontend workflow dung dung script.
- Typecheck/build/test backend va frontend da pass.
- Them migration `20260515074500_rename_legacy_ai_columns` de doi `quizzes.isAiGenerated` -> `isGenerated` va `user_speaking_attempts.aiFeedback` -> `feedback`.
- Them `AuditModule` va audit log cho auth/security actions cung cac admin write actions quan trong.
- Them cache hit/miss/hit-rate metrics tu `RedisService` vao `/metrics`.
- Them retention scheduler hang ngay cho analytics events, queue jobs da ket thuc va orphan media.
- Them Playwright real-backend E2E flow tai `frontend/e2e/full-flow.real.spec.ts`.

Con nen lam sau:

- Chay migration tren DB that: `npx prisma migrate deploy`.
- Chay E2E real-backend voi env `E2E_API_URL`, `E2E_ADMIN_EMAIL`, `E2E_ADMIN_PASSWORD`.
- Mo rong audit log cho cac admin CRUD ngoai `AdminController` neu can bao phu tung module rieng nhu vocabulary/quiz/menu.
- Day cache metrics sang Prometheus provider rieng neu can label theo cache namespace.

## Tom tat hien trang

Du an da co nen tang kha day du: auth JWT + session, RBAC, vocabulary, flashcards, quizzes, courses/sections/lessons, speaking, progress, leaderboard, notifications, queues, Redis cache, media upload, email queue, health/metrics, Docker, nginx, Prometheus/Grafana va CI/CD workflow.

Nhieu P0 cu trong cac checklist da duoc trien khai mot phan hoac gan xong:

- Media upload da co S3/MinIO client, validate mime/size, ghi metadata va signed URL.
- Email queue da co Nodemailer SMTP processor, fallback log khi chua cau hinh SMTP.
- WebSocket gateway da co token auth, session validation, origin whitelist va rate limit theo IP.
- Progress, XP, notification transaction da duoc cai thien so voi checklist cu.
- Admin UI, queue UI, menu dong va nhieu man hinh CRUD da ton tai.

Van chua nen xem he thong la production-ready. Cac muc duoi day la nhung viec con can lam, khong tinh AI.

## P0 - Da xu ly trong dot nay

### 1. Guard/RBAC chua dong bo tren mot so controller

Trang thai: da gan guard truc tiep cho cac controller duoc neu trong danh sach, chua chuyen sang global guard de tranh anh huong rong toi health/auth.

Da sua toi thieu:

- `backend/src/modules/courses/controllers/courses.controller.ts`: cac endpoint create/update/publish/delete va `:id/progress`.
- `backend/src/modules/courses/controllers/sections.controller.ts`: create/update/delete.
- `backend/src/modules/courses/controllers/lessons.controller.ts`: create/update/delete.
- `backend/src/modules/media/controllers/media.controller.ts`: upload/delete/get signed URL.
- `backend/src/modules/speaking/controllers/speaking.controller.ts`: create exercise, submit attempt, attempts/stats.
- `backend/src/modules/leaderboard/controllers/leaderboard.controller.ts`: `me` va `position`.
- `backend/src/queues/controllers/queue.controller.ts`: job status nen yeu cau auth va chi cho admin/owner xem.

Khuyen nghi sau: neu muon giam nguy co quen guard o controller moi, co the chuyen sang global guard trong mot PR rieng va gan `@Public()` day du cho health/auth/public APIs.

### 2. Frontend/backend route contract bi lech o course/lesson

Trang thai: da bo sung alias route backend cho cac route frontend dang goi.

- `GET /courses/:courseId/sections/:sectionId/lessons` trong `frontend/src/features/courses/api/courses.api.ts`, nhung backend dang co `GET /sections/:sectionId/lessons`.
- `POST /lessons/:lessonId/view` chua co backend endpoint tuong ung.
- `PATCH /lessons/:lessonId` va `DELETE /lessons/:lessonId` chua khop voi backend `PATCH/DELETE /sections/:sectionId/lessons/:id`.

Can tiep tuc: hop nhat API contract trong `docs/api-contracts.md` de khong ton tai song song nhieu alias lau dai.

### 3. Media upload can chot hanh vi storage that

Trang thai: da bo sung local fallback ghi file, static serving `/uploads`, checksum metadata, delete wildcard va signed URL dung key that.

- Neu khong co S3 credentials, service tra `/uploads/...` nhung khong thay static file serving/local disk persistence tuong ung.
- `getSignedUrl` dang dung `fileKey` input de tao signed URL sau khi tim media theo id/fileKey; can dam bao dung `media.fileKey` khi input la id.
- `Delete /media/:fileKey` co fileKey chua dau `/`, nen route param don khong phu hop voi key dang co folder path nhu `images/2026/05/...`.
- Can them owner/userId, checksum, scan/validation sau upload neu dung cho production.

### 4. Speaking flow con mock audio va ket qua gia lap

Bo qua AI, flow speaking van can xu ly audio thuc:

- `frontend/src/app/(main)/speaking/page.tsx` ghi am nhung khong upload file, ma gui `https://storage.example.com/audio/mock.wav`.
- `backend/src/queues/processors/queue.processors.ts` processor speaking tao transcript/score mau.
- `handleStopRecording` chi set state, chua goi `mediaRecorder.stop()` that su vi recorder nam trong scope cua `handleStartRecording`.

Trang thai: frontend da upload audio qua media endpoint; backend luu attempt va tra thong bao scoring disabled, khong goi provider ngoai.

### 5. CI/CD va deploy van con placeholder

Trang thai: CD da dung `curl` health check that cho staging/production qua secrets URL; frontend workflow dung dung script hien co.

- Them health check that cho staging/production.
- Bo sung migration strategy truoc deploy.
- Them rollback/runbook cu the.
- Can frontend CI build/test duoc gate chung voi backend neu release full-stack.

## P1 - Core logic va data quality

### 1. Auth/security

- Register dang tao user `PENDING_VERIFICATION` nhung login chi chan `SUSPENDED`; can quyet dinh co bat buoc verify email hay khong.
- Refresh token duoc hash trong `UserSession.refreshToken`, nhung refresh flow chi verify JWT va revoke session, chua so sanh token hash dang luu. Nen so sanh hash de phong truong hop token cu/khong dung session bi replay.
- Password policy, login attempt limiting/account lockout, revoke device UI can bo sung neu production.
- Swagger dang bat mac dinh neu `ENABLE_SWAGGER` khac false; production nen disable mac dinh theo `NODE_ENV`.

### 2. Queue/job tracking

- `QueueJob.status` khi add job la `PENDING`, nhung processor khong cap nhat `PROCESSING`/`attempts` dong bo cho moi queue.
- Notification processor chua cap nhat `queue_jobs` status.
- Can job ownership/permission cho API lay job status.
- Can UI/admin filter theo queue/status, retry/cancel neu can van hanh.

### 3. Cache invalidation va metrics

- Redis cache da co trong nhieu service, nhung invalidation chua dong bo bang event cho tat ca write path.
- Tai lieu cache co cac muc con thieu: cache monitoring, hit-rate tracking, circuit breaker, stampede prevention, performance test.
- Nen them metrics rieng cho cache hit/miss va queue latency/failure.

### 4. Progress, XP, leaderboard

- `PointsService` da centralize XP, nhung can quet tiep cac flow write de dam bao deu di qua service nay.
- Level update chua thay duoc xu ly khi XP tang; can cap nhat level theo threshold hoac scheduler.
- Leaderboard rank update/precompute can duoc xac nhan voi du lieu lon.

### 5. Audit log va data retention

- Prisma schema co `AuditLog`, nhung chua thay audit logging dong bo cho admin/security actions.
- Can retention policy cho `analytics_events`, `queue_jobs`, notification cu va media orphaned files.

## P2 - Frontend UX va contract

- An/feature-flag cac surface AI deferred: nav/menu, home copy, speaking copy, `/ai` page, README copy neu can.
- Them error/empty/loading states dong bo cho admin CRUD va learning flows.
- Course/lesson UX can hoan thien sau khi route contract duoc chot.
- Settings page/profile/session management can noi that voi backend neu chua xong.
- Kiem tra responsive va text overflow cho cac bang admin, menu dong va quiz taker.

## P3 - Tests

Da co mot so test backend service va frontend queue hook/API, nhung coverage chua bao het cac flow quan trong.

Can them:

- Backend: guard/RBAC integration tests, media upload signed URL/delete, email processor SMTP/fallback, queue status, course/lesson route contract, auth refresh hash/replay.
- Frontend: auth forms, course/lesson flow, quiz submit, flashcard review, speaking upload state.
- E2E: register/login -> learn course -> review flashcard -> submit quiz -> check progress; admin CRUD vocabulary/course; queue status UI.

## Tai lieu

Giu lai cac tai lieu tham chieu theo chuyen de:

- `docs/api-contracts.md`
- `docs/authentication_architecture_jwt_session_security_vi.md`
- `docs/cache-strategy.md`
- `docs/security-hardening.md`
- `docs/deployment.md`
- `docs/development.md`
- `docs/database-migrations.md`
- `docs/monitoring-logging.md`
- `docs/permissions.md`
- `docs/events.md`
- cac tai lieu architecture/roadmap tong quan khac neu van can tra cuu.

Da hop nhat va da xoa cac file ke hoach/cu checklist lap lai:

- `docs/IMPLEMENTATION_PLAN.md`
- `docs/IMPLEMENTATION_PENDING_TASKS.md`
- `docs/IMPLEMENTATION_CHECKLIST_NO_AI.md`
- `docs/KE_HOACH_CAI_TIEN_VA_TRIEN_KHAI_TIEP_THEO.md`

File nay thay the cac file tren lam tracker chinh cho phan non-AI.

## Thu tu de xuat

1. Sua guard/RBAC toan cuc hoac gan guard day du cho cac controller con thieu.
2. Chot va sua route contract course/section/lesson giua frontend va backend.
3. Hoan thien media upload/signed URL/delete voi key co folder path.
4. Sua speaking non-AI flow: upload audio that, bo mock URL, wording khong hua AI.
5. Hoan thien queue status/permission va notification processor status.
6. Them tests cho cac muc tren.
7. Don lai copy/docs/menu de AI o trang thai deferred ro rang.
