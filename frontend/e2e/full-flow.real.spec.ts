import { expect, request, test } from "@playwright/test";

const apiUrl = process.env.E2E_API_URL;
const adminEmail = process.env.E2E_ADMIN_EMAIL;
const adminPassword = process.env.E2E_ADMIN_PASSWORD;

test.describe("real backend learning flow", () => {
  test.skip(
    !apiUrl || !adminEmail || !adminPassword,
    "Set E2E_API_URL, E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD to run against a real backend/database.",
  );

  test("registers, learns a lesson, submits a quiz, and checks progress", async () => {
    const api = await request.newContext({ baseURL: apiUrl });
    const stamp = Date.now();
    const studentEmail = `e2e-${stamp}@example.com`;
    const password = "Test123!";

    const adminLogin = await api.post("/auth/login", {
      data: { email: adminEmail, password: adminPassword },
    });
    expect(adminLogin.ok()).toBeTruthy();
    const adminToken = unwrap(await adminLogin.json()).accessToken;

    const authHeaders = (token: string) => ({
      Authorization: `Bearer ${token}`,
    });

    const course = unwrap(
      await (
        await api.post("/courses", {
          headers: authHeaders(adminToken),
          data: {
            title: `E2E Course ${stamp}`,
            description: "Created by Playwright E2E",
            level: "BEGINNER",
          },
        })
      ).json(),
    );

    const section = unwrap(
      await (
        await api.post(`/courses/${course.id}/sections`, {
          headers: authHeaders(adminToken),
          data: {
            title: "Getting started",
            description: "E2E section",
          },
        })
      ).json(),
    );

    const lesson = unwrap(
      await (
        await api.post(`/sections/${section.id}/lessons`, {
          headers: authHeaders(adminToken),
          data: {
            title: "First lesson",
            description: "E2E lesson",
            type: "READING",
            content: "Practice a short English sentence.",
            estimatedTime: 5,
          },
        })
      ).json(),
    );

    const quiz = unwrap(
      await (
        await api.post("/quizzes/admin/quizzes", {
          headers: authHeaders(adminToken),
          data: {
            lessonId: lesson.id,
            title: `E2E Quiz ${stamp}`,
            type: "MULTIPLE_CHOICE",
            passingScore: 70,
            questions: [
              {
                type: "SINGLE_CHOICE",
                question: "Which word is a greeting?",
                answers: [
                  { answer: "Hello", isCorrect: true },
                  { answer: "Table", isCorrect: false },
                ],
              },
            ],
          },
        })
      ).json(),
    );

    const register = await api.post("/auth/register", {
      data: {
        email: studentEmail,
        password,
        fullName: "E2E Student",
      },
    });
    expect(register.ok()).toBeTruthy();
    const studentToken = unwrap(await register.json()).accessToken;

    const courses = unwrap(await (await api.get("/courses")).json());
    expect(courses.data.some((item: { id: string }) => item.id === course.id)).toBeTruthy();

    const lessons = unwrap(
      await (await api.get(`/courses/${course.id}/sections/${section.id}/lessons`)).json(),
    );
    expect(lessons.some((item: { id: string }) => item.id === lesson.id)).toBeTruthy();

    const view = await api.post(`/lessons/${lesson.id}/view`, {
      headers: authHeaders(studentToken),
    });
    expect(view.ok()).toBeTruthy();

    const quizDetail = unwrap(await (await api.get(`/quizzes/${quiz.id}`)).json());
    const firstQuestion = quizDetail.questions[0];
    const correctAnswer = firstQuestion.answers.find(
      (answer: { isCorrect: boolean }) => answer.isCorrect,
    );

    const submit = await api.post(`/quizzes/${quiz.id}/submit`, {
      headers: authHeaders(studentToken),
      data: {
        answers: [
          {
            questionId: firstQuestion.id,
            answerIds: [correctAnswer.id],
          },
        ],
      },
    });
    expect(submit.ok()).toBeTruthy();
    expect(unwrap(await submit.json()).score).toBeGreaterThanOrEqual(70);

    const progress = unwrap(
      await (
        await api.get(`/courses/${course.id}/progress`, {
          headers: authHeaders(studentToken),
        })
      ).json(),
    );
    expect(progress.completedLessons).toBeGreaterThanOrEqual(1);
  });
});

function unwrap(payload: any) {
  return payload?.data ?? payload;
}
