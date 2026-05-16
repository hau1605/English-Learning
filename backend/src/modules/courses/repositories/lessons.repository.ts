import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { LessonType } from '@prisma/client';

@Injectable()
export class LessonsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAllBySection(sectionId: string) {
    return this.prisma.lesson.findMany({
      where: { sectionId },
      orderBy: { orderIndex: 'asc' },
    });
  }

  async findById(id: string) {
    return this.prisma.lesson.findUnique({
      where: { id },
      include: {
        section: true,
      },
    });
  }

  async create(
    sectionId: string,
    data: { title: string; description?: string; type?: LessonType; content?: string; videoUrl?: string; estimatedTime?: number; orderIndex?: number },
  ) {
    return this.prisma.lesson.create({
      data: {
        title: data.title,
        description: data.description,
        content: data.content,
        type: data.type ?? LessonType.READING,
        videoUrl: data.videoUrl,
        estimatedTime: data.estimatedTime,
        orderIndex: data.orderIndex ?? 0,
        section: { connect: { id: sectionId } },
      },
    });
  }

  async update(
    id: string,
    data: { title?: string; description?: string; type?: LessonType; content?: string; videoUrl?: string; estimatedTime?: number; orderIndex?: number }
  ) {
    return this.prisma.lesson.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.lesson.delete({ where: { id } });
  }

  async markAsViewed(userId: string, lessonId: string) {
    return this.prisma.lessonView.create({
      data: {
        userId,
        lessonId,
      },
    });
  }

  async getNextOrderIndex(sectionId: string): Promise<number> {
    const lastLesson = await this.prisma.lesson.findFirst({
      where: { sectionId },
      orderBy: { orderIndex: 'desc' },
      select: { orderIndex: true },
    });
    return (lastLesson?.orderIndex ?? -1) + 1;
  }

  async getLessonWithContent(id: string) {
    return this.prisma.lesson.findUnique({
      where: { id },
      include: {
        section: {
          include: {
            course: true,
          },
        },
        quizzes: {
          where: { publishedAt: { not: null } },
          take: 1,
        },
        speakingExercises: true,
      },
    });
  }
}
