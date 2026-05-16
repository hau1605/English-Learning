import { Test } from "@nestjs/testing";
import { EmailProcessor } from "./queue.processors";
import { PrismaService } from "@/prisma/prisma.service";
import { ConfigService } from "@nestjs/config";

describe("EmailProcessor", () => {
  let processor: EmailProcessor;
  let prismaService: PrismaService;
  let configService: ConfigService;

  const mockPrisma = {
    queueJob: {
      update: jest.fn().mockResolvedValue({
        id: "1",
        status: "COMPLETED",
        processedAt: new Date(),
      }),
    },
  };

  beforeEach(async () => {
    const configMock = { get: jest.fn().mockReturnValue(undefined) };
    const module = await Test.createTestingModule({
      providers: [
        EmailProcessor,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ConfigService, useValue: configMock },
      ],
    }).compile();
    processor = module.get(EmailProcessor);
    prismaService = module.get(PrismaService);
    configService = module.get(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("handleSendEmail", () => {
    it("should process email job without SMTP transporter configured", async () => {
      const job: any = {
        id: "1",
        name: "send",
        data: {
          to: "user@example.com",
          subject: "Welcome",
          html: "<p>Welcome!</p>",
          jobId: "job-1",
        },
      };

      const result = await processor["handleSendEmail"](job);

      expect(result).toEqual({
        success: true,
        to: "user@example.com",
        subject: "Welcome",
      });
    });

    it("should update queue job status on successful email send", async () => {
      const job: any = {
        id: "1",
        name: "send",
        data: {
          to: "user@example.com",
          subject: "Test",
          html: "<p>Test</p>",
          jobId: "job-1",
        },
      };

      await processor["handleSendEmail"](job);

      expect(prismaService.queueJob.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "job-1" },
          data: expect.objectContaining({
            status: "COMPLETED",
          }),
        }),
      );
    });

    it("should handle email to multiple recipients", async () => {
      const job: any = {
        id: "1",
        name: "send",
        data: {
          to: ["user1@example.com", "user2@example.com"],
          subject: "Batch Email",
          html: "<p>Batch</p>",
          jobId: "job-2",
        },
      };

      const result = await processor["handleSendEmail"](job);

      expect(result.success).toBe(true);
    });

    it("should log email when SMTP not configured", async () => {
      const job: any = {
        id: "1",
        name: "send",
        data: {
          to: "user@example.com",
          subject: "Test",
          html: "<p>Test</p>",
          jobId: "job-1",
        },
      };

      const result = await processor["handleSendEmail"](job);

      expect(result.success).toBe(true);
      expect(result.to).toBe("user@example.com");
    });
  });

  describe("Email Job Error Handling", () => {
    it("should update job status on processing", async () => {
      const job: any = {
        id: "1",
        name: "send",
        data: {
          to: "user@example.com",
          subject: "Test",
          html: "<p>Test</p>",
          jobId: "job-1",
        },
      };

      await processor["handleSendEmail"](job);

      // Verify job status update was called
      expect(prismaService.queueJob.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "job-1" },
          data: expect.any(Object),
        }),
      );
    });
  });

  describe("Email Subject and Content Handling", () => {
    it("should preserve email subject line", async () => {
      const testSubject = "Password Reset - Action Required";
      const job: any = {
        id: "1",
        name: "send",
        data: {
          to: "user@example.com",
          subject: testSubject,
          html: "<p>Reset link</p>",
          jobId: "job-1",
        },
      };

      const result = await processor["handleSendEmail"](job);

      expect(result.subject).toBe(testSubject);
    });

    it("should handle HTML content in email body", async () => {
      const htmlContent = "<h1>Welcome</h1><p>You are registered</p>";
      const job: any = {
        id: "1",
        name: "send",
        data: {
          to: "user@example.com",
          subject: "Welcome",
          html: htmlContent,
          jobId: "job-1",
        },
      };

      const result = await processor["handleSendEmail"](job);

      expect(result.success).toBe(true);
    });
  });
});
