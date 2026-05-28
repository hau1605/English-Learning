import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CourseLevel } from '@prisma/client';

@Injectable()
export class SectionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAllByCourse(courseId: string) {
    return this.prisma.courseSection.findMany({
      where: { courseId },
      orderBy: { orderIndex: 'asc' },
      include: {
        course: {
          select: { id: true, title: true },
        },
        lessons: {
          orderBy: { orderIndex: 'asc' },
        },
      },
    });
  }

  async findById(id: string) {
    return this.prisma.courseSection.findUnique({
      where: { id },
      include: {
        lessons: {
          orderBy: { orderIndex: 'asc' },
        },
        course: true,
      },
    });
  }

  async create(courseId: string, data: { title: string; description?: string; orderIndex?: number }) {
    return this.prisma.courseSection.create({
      data: {
        title: data.title,
        description: data.description,
        orderIndex: data.orderIndex ?? 0,
        course: { connect: { id: courseId } },
      },
      include: {
        course: {
          select: { id: true, title: true },
        },
        lessons: {
          orderBy: { orderIndex: 'asc' },
        },
      },
    });
  }

  async update(id: string, data: { title?: string; description?: string; orderIndex?: number }) {
    return this.prisma.courseSection.update({
      where: { id },
      data,
      include: {
        course: {
          select: { id: true, title: true },
        },
        lessons: {
          orderBy: { orderIndex: 'asc' },
        },
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.courseSection.delete({ where: { id } });
  }

  async getNextOrderIndex(courseId: string): Promise<number> {
    const lastSection = await this.prisma.courseSection.findFirst({
      where: { courseId },
      orderBy: { orderIndex: 'desc' },
      select: { orderIndex: true },
    });
    return (lastSection?.orderIndex ?? -1) + 1;
  }
}
