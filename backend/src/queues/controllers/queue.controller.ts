import { Controller, Get, Param, NotFoundException, UseGuards } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { JwtAuthGuard } from "@/modules/auth/guards/jwt-auth.guard";
import { PermissionGuard } from "@/modules/permissions/guards/permission.guard";
import { Permissions } from "@/modules/permissions/decorators/permissions.decorator";

@Controller("queues")
@UseGuards(JwtAuthGuard, PermissionGuard)
export class QueueController {
  constructor(private readonly prisma: PrismaService) {}

  @Get("job/:id")
  @Permissions("admin.view")
  async getJob(@Param("id") id: string) {
    const job = await this.prisma.queueJob.findUnique({ where: { id } });
    if (!job) throw new NotFoundException("Job not found");
    return job;
  }
}

export default QueueController;
