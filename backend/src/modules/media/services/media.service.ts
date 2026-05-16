import { Injectable, Logger, BadRequestException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "@/prisma/prisma.service";
import { MediaType } from "../dto/media.dto";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl as awsGetSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createHash } from "crypto";
import { promises as fs } from "fs";
import path from "path";

export interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);
  private readonly bucket: string;
  private readonly cdnUrl: string;
  private readonly maxFileSize: number;
  private readonly s3?: S3Client;
  private readonly s3Enabled: boolean;
  private readonly localUploadRoot: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.bucket =
      this.configService.get<string>("S3_BUCKET") || "english-learning";
    this.cdnUrl = this.configService.get<string>("CDN_URL") || "";
    this.maxFileSize = 10 * 1024 * 1024; // 10MB
    this.localUploadRoot =
      this.configService.get<string>("LOCAL_UPLOAD_ROOT") ||
      path.resolve(process.cwd(), "uploads");
    const s3Endpoint =
      this.configService.get<string>("S3_ENDPOINT") ||
      this.configService.get<string>("S3_PUBLIC_URL");
    const s3Region = this.configService.get<string>("S3_REGION") || "us-east-1";
    const accessKeyId =
      this.configService.get<string>("AWS_ACCESS_KEY_ID") ||
      this.configService.get<string>("S3_ACCESS_KEY");
    const secretAccessKey =
      this.configService.get<string>("AWS_SECRET_ACCESS_KEY") ||
      this.configService.get<string>("S3_SECRET_KEY");

    if (accessKeyId && secretAccessKey) {
      this.s3 = new S3Client({
        region: s3Region,
        endpoint: s3Endpoint,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
        forcePathStyle: !!s3Endpoint, // required for MinIO
      });
      this.s3Enabled = true;
    } else {
      this.s3Enabled = false;
    }
  }

  async uploadFile(
    file: UploadedFile,
    folder: string = "general",
  ): Promise<{
    id: string;
    fileKey: string;
    fileUrl: string;
    mimeType: string;
    size: number;
    bucket: string;
  }> {
    this.validateFile(file);

    const fileKey = this.generateFileKey(
      folder,
      file.originalname,
      file.mimetype,
    );

    let fileUrl = this.cdnUrl
      ? `${this.cdnUrl}/${fileKey}`
      : `/uploads/${fileKey}`;

    if (this.s3Enabled && this.s3) {
      // upload to S3/MinIO
      const put = new PutObjectCommand({
        Bucket: this.bucket,
        Key: fileKey,
        Body: file.buffer,
        ContentType: file.mimetype,
        ContentLength: file.size,
      });

      await this.s3.send(put);

      // Use CDN if provided; otherwise leave fileUrl as key (signed URLs served on demand)
      if (!this.cdnUrl) {
        fileUrl = fileKey;
      }
    } else {
      const localPath = this.resolveLocalPath(fileKey);
      await fs.mkdir(path.dirname(localPath), { recursive: true });
      await fs.writeFile(localPath, file.buffer);
    }

    const checksum = createHash("sha256").update(file.buffer).digest("hex");

    const media = await this.prisma.mediaFile.create({
      data: {
        fileKey,
        fileUrl,
        mimeType: file.mimetype,
        size: file.size,
        bucket: this.bucket,
        metadata: {
          checksum,
          originalName: file.originalname,
          storage: this.s3Enabled ? "s3" : "local",
        },
      },
    });

    this.logger.log(`File uploaded: ${fileKey}`);

    return {
      id: media.id,
      fileKey: media.fileKey,
      fileUrl: media.fileUrl,
      mimeType: media.mimeType,
      size: media.size,
      bucket: media.bucket,
    };
  }

  async uploadAudio(
    file: UploadedFile,
    folder: string = "audio",
  ): Promise<{
    id: string;
    fileKey: string;
    fileUrl: string;
    mimeType: string;
    size: number;
  }> {
    this.validateAudioFile(file);
    return this.uploadFile(file, folder);
  }

  async uploadImage(
    file: UploadedFile,
    folder: string = "images",
  ): Promise<{
    id: string;
    fileKey: string;
    fileUrl: string;
    mimeType: string;
    size: number;
  }> {
    this.validateImageFile(file);
    return this.uploadFile(file, folder);
  }

  async deleteFile(fileKey: string): Promise<void> {
    if (this.s3Enabled && this.s3) {
      const del = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: fileKey,
      });

      try {
        await this.s3.send(del);
      } catch (err) {
        this.logger.error(`Failed to delete from S3: ${err}`);
      }
    } else {
      try {
        await fs.unlink(this.resolveLocalPath(fileKey));
      } catch (err: any) {
        if (err?.code !== "ENOENT") {
          this.logger.error(`Failed to delete local file: ${err}`);
        }
      }
    }

    await this.prisma.mediaFile.delete({
      where: { fileKey },
    });

    this.logger.log(`File deleted: ${fileKey}`);
  }

  async getSignedUrl(
    fileKey: string,
    expiresIn: number = 3600,
  ): Promise<string> {
    // support passing either id (uuid) or fileKey
    let media = await this.prisma.mediaFile.findUnique({
      where: { id: fileKey },
    });
    if (!media) {
      media = await this.prisma.mediaFile.findUnique({ where: { fileKey } });
    }

    if (!media) {
      throw new BadRequestException("File not found");
    }

    if (this.s3Enabled && this.s3) {
      const getCmd = new GetObjectCommand({
        Bucket: this.bucket,
        Key: media.fileKey,
      });
      const url = await awsGetSignedUrl(this.s3, getCmd, { expiresIn });
      return url;
    }

    return media.fileUrl;
  }

  private resolveLocalPath(fileKey: string): string {
    const normalizedKey = path.normalize(fileKey).replace(/^(\.\.(\/|\\|$))+/, "");
    const resolved = path.resolve(this.localUploadRoot, normalizedKey);

    if (!resolved.startsWith(this.localUploadRoot)) {
      throw new BadRequestException("Invalid file key");
    }

    return resolved;
  }

  private validateFile(file: UploadedFile): void {
    if (file.size > this.maxFileSize) {
      throw new BadRequestException(
        `File size exceeds maximum allowed size of ${this.maxFileSize / 1024 / 1024}MB`,
      );
    }
  }

  private validateImageFile(file: UploadedFile): void {
    const allowedMimeTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        "Only JPEG, PNG, GIF, and WebP images are allowed",
      );
    }
  }

  private validateAudioFile(file: UploadedFile): void {
    const allowedMimeTypes = [
      "audio/mpeg",
      "audio/wav",
      "audio/ogg",
      "audio/mp4",
      "audio/webm",
    ];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        "Only MP3, WAV, OGG, MP4, and WebM audio files are allowed",
      );
    }
  }

  private generateFileKey(
    folder: string,
    originalName: string,
    mimetype: string,
  ): string {
    const timestamp = Date.now();
    const extension = this.getExtension(mimetype);
    const sanitizedName = originalName.replace(/[^a-zA-Z0-9.-]/g, "_");
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");

    return `${folder}/${year}/${month}/${timestamp}-${sanitizedName}${extension}`;
  }

  private getExtension(mimetype: string): string {
    const extensions: Record<string, string> = {
      "image/jpeg": ".jpg",
      "image/png": ".png",
      "image/gif": ".gif",
      "image/webp": ".webp",
      "audio/mpeg": ".mp3",
      "audio/wav": ".wav",
      "audio/ogg": ".ogg",
      "audio/mp4": ".mp4",
      "audio/webm": ".webm",
      "video/mp4": ".mp4",
      "video/webm": ".webm",
    };

    return extensions[mimetype] || "";
  }
}
