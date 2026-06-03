import { Module } from "@nestjs/common";
import { PrismaModule } from "@/prisma/prisma.module";
import { NotesController } from "@/modules/notes/controllers/notes.controller";
import { NotesService } from "@/modules/notes/services/notes.service";
import { PermissionsModule } from "../permissions/permissions.module";

@Module({
  imports: [PrismaModule, PermissionsModule],
  controllers: [NotesController],
  providers: [NotesService],
  exports: [NotesService],
})
export class NotesModule {}
