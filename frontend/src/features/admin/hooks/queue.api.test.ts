import { describe, expect, it, vi } from "vitest";

vi.mock("@/services/api", () => ({
  api: {
    get: vi
      .fn()
      .mockResolvedValue({
        data: { success: true, message: "", data: { id: "job-1" } },
      }),
  },
}));

import { queueApi } from "./use-queue.hook";

describe("queueApi", () => {
  it("calls api.get with correct path and returns data", async () => {
    const res = await queueApi.getJob("job-1");
    expect(res).toBeDefined();
    expect(res.data.id).toBe("job-1");
  });
});
