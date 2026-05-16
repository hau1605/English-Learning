import { test, expect } from "@playwright/test";

test.describe("Queue Monitor E2E", () => {
  test("visits queue monitor and searches for a job id", async ({ page }) => {
    // Mock backend API for job details
    await page.route("**/api/v1/queues/job/*", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          message: "",
          data: {
            id: "job-1",
            name: "send-email",
            data: { to: "user@example.com" },
            status: "COMPLETED",
            attempts: 1,
            maxAttempts: 3,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        }),
      });
    });

    await page.goto("http://localhost:3681/admin/queues");

    // Wait for page to load
    await expect(page.locator("text=Queue Job Monitor")).toBeVisible();

    // Fill job id input and submit
    const input = page.locator('input[placeholder="Enter Job ID..."]');
    await input.fill("job-1");

    const searchButton = page.locator('button:has-text("Search")');
    await searchButton.click();

    // Expect job details to show up
    await expect(page.locator("text=Job Status")).toBeVisible();
    await expect(page.locator("text=COMPLETED")).toBeVisible();
  });
});
