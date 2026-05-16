import { Injectable } from '@nestjs/common';
import { CoursesRepository } from '../repositories/courses.repository';
import { SectionsRepository } from '../repositories/sections.repository';
import { PrismaService } from '@/prisma/prisma.service';
import { Course, CourseStatus, CourseLevel } from '@prisma/client';

export interface CourseWithMeta {
  data: (Course & { totalLessons: number })[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

@Injectable()
export class CoursesService {
  constructor(
    private readonly coursesRepository: CoursesRepository,
    private readonly sectionsRepository: SectionsRepository,
    private readonly prisma: PrismaService,
  ) {}

  async findAll(params: {
    status?: CourseStatus;
    level?: CourseLevel;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<CourseWithMeta> {
    return this.coursesRepository.findAll(params);
  }

  async findById(id: string) {
    return this.coursesRepository.findById(id);
  }

  async findPublished(): Promise<Course[]> {
    return this.coursesRepository.findPublished();
  }

  async create(data: {
    title: string;
    description?: string;
    level: CourseLevel;
    thumbnail?: string;
  }): Promise<Course> {
    return this.coursesRepository.create({
      title: data.title,
      description: data.description,
      level: data.level,
      thumbnail: data.thumbnail,
      status: 'DRAFT',
    });
  }

  async update(
    id: string,
    data: {
      title?: string;
      description?: string;
      level?: CourseLevel;
      thumbnail?: string;
    }
  ): Promise<Course> {
    return this.coursesRepository.update(id, data);
  }

  async delete(id: string): Promise<void> {
    return this.coursesRepository.delete(id);
  }

  async publish(id: string): Promise<Course> {
    return this.coursesRepository.publish(id);
  }

  async getCourseProgress(userId: string, courseId: string) {
    const course = await this.coursesRepository.findById(courseId);
    if (!course) return null;

    const lessonIds = course.sections.flatMap(s => s.lessons.map(l => l.id));
    const totalLessons = lessonIds.length;

    if (totalLessons === 0) {
      return {
        courseId,
        totalLessons: 0,
        completedLessons: 0,
        progress: 0,
      };
    }

    const completedViews = await this.getCompletedLessonsCount(userId, lessonIds);

    return {
      courseId,
      totalLessons,
      completedLessons: completedViews,
      progress: Math.round((completedViews / totalLessons) * 100),
    };
  }

  private async getCompletedLessonsCount(
    userId: string,
    lessonIds: string[]
  ): Promise<number> {
    const uniqueViews = await this.prisma.lessonView.findMany({
      where: {
        userId,
        lessonId: { in: lessonIds },
      },
      distinct: ['lessonId'],
    });

    return uniqueViews.length;
  }
}
