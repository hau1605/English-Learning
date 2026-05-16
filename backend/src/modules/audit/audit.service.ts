import { Injectable, Logger } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { PrismaService } from "@/prisma/prisma.service";

export interface AuditContext {
  actorId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async log(params: {
    action: string;
    entityType?: string;
    entityId?: string;
    metadata?: Record<string, unknown>;
    context?: AuditContext;
  }): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          actorId: params.context?.actorId || null,
          action: params.action,
          entityType: params.entityType,
          entityId: params.entityId,
          metadata: params.metadata as Prisma.InputJsonValue | undefined,
          ipAddress: params.context?.ipAddress || null,
          userAgent: params.context?.userAgent || null,
        },
      });
    } catch (error) {
      this.logger.warn(`Failed to write audit log for ${params.action}: ${error}`);
    }
  }
}
