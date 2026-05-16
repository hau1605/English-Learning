import { describe, it, expect, vi } from "vitest";

describe("useQueueJob hook", () => {
  it("hook module can be imported and exports useQueueJob", async () => {
    const module = await import("./use-queue.hook");
    expect(module.useQueueJob).toBeDefined();
    expect(typeof module.useQueueJob).toBe("function");
  });

  it("exports useRefreshQueueJob mutation hook", async () => {
    const module = await import("./use-queue.hook");
    expect(module.useRefreshQueueJob).toBeDefined();
    expect(typeof module.useRefreshQueueJob).toBe("function");
  });

  it("exports queueApi with getJob method", async () => {
    const module = await import("./use-queue.hook");
    expect(module.queueApi).toBeDefined();
    expect(module.queueApi.getJob).toBeDefined();
    expect(typeof module.queueApi.getJob).toBe("function");
  });
});
