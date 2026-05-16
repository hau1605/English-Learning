import { Test } from "@nestjs/testing";
import { MediaService, UploadedFile } from "./media.service";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "@/prisma/prisma.service";

const mockPrisma = {
  mediaFile: {
    create: jest
      .fn()
      .mockResolvedValue({
        id: "1",
        fileKey: "k",
        fileUrl: "/u/k",
        mimeType: "image/png",
        size: 123,
        bucket: "b",
      }),
  },
};

describe("MediaService", () => {
  let service: MediaService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        MediaService,
        { provide: ConfigService, useValue: { get: () => undefined } },
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get(MediaService);
  });

  it("should validate image and upload", async () => {
    const file: UploadedFile = {
      fieldname: "file",
      originalname: "test.png",
      encoding: "7bit",
      mimetype: "image/png",
      size: 1024,
      buffer: Buffer.from("abc"),
    };

    const res = await service.uploadImage(file);
    expect(res).toHaveProperty("id");
    expect(mockPrisma.mediaFile.create).toHaveBeenCalled();
  });

  it("should reject large files", async () => {
    const file: UploadedFile = {
      fieldname: "file",
      originalname: "big.png",
      encoding: "7bit",
      mimetype: "image/png",
      size: 20 * 1024 * 1024,
      buffer: Buffer.from("a"),
    };

    await expect(service.uploadImage(file)).rejects.toThrow();
  });
});
