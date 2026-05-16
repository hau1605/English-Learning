import { Module } from '@nestjs/common';
import { CoursesController } from './controllers/courses.controller';
import { CourseSectionsController } from './controllers/sections.controller';
import { LessonAliasesController, LessonsController } from './controllers/lessons.controller';
import { CoursesService } from './services/courses.service';
import { CourseSectionsService } from './services/sections.service';
import { LessonsService } from './services/lessons.service';
import { CoursesRepository } from './repositories/courses.repository';
import { SectionsRepository } from './repositories/sections.repository';
import { LessonsRepository } from './repositories/lessons.repository';
import { PrismaModule } from '@/prisma/prisma.module';
import { PermissionsModule } from '@/modules/permissions/permissions.module';

@Module({
  imports: [PrismaModule, PermissionsModule],
  controllers: [
    CoursesController,
    CourseSectionsController,
    LessonsController,
    LessonAliasesController,
  ],
  providers: [
    CoursesService,
    CourseSectionsService,
    LessonsService,
    CoursesRepository,
    SectionsRepository,
    LessonsRepository,
  ],
  exports: [CoursesService, CourseSectionsService, LessonsService],
})
export class CoursesModule {}
