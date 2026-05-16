import { Injectable } from '@nestjs/common';
import { LessonsRepository } from '../repositories/lessons.repository';
import { CreateLessonDto, UpdateLessonDto } from '../dto/lesson.dto';

@Injectable()
export class LessonsService {
  constructor(private readonly lessonsRepository: LessonsRepository) {}

  async findAllBySection(sectionId: string) {
    return this.lessonsRepository.findAllBySection(sectionId);
  }

  async findById(id: string) {
    return this.lessonsRepository.findById(id);
  }

  async create(sectionId: string, dto: CreateLessonDto) {
    return this.lessonsRepository.create(sectionId, dto);
  }

  async update(id: string, dto: UpdateLessonDto) {
    return this.lessonsRepository.update(id, dto);
  }

  async delete(id: string): Promise<void> {
    return this.lessonsRepository.delete(id);
  }

  async markAsViewed(userId: string, lessonId: string) {
    return this.lessonsRepository.markAsViewed(userId, lessonId);
  }

  async reorder(sectionId: string, orderedIds: string[]) {
    const updates = orderedIds.map((id, index) =>
      this.lessonsRepository.update(id, { orderIndex: index })
    );
    await Promise.all(updates);
    return this.findAllBySection(sectionId);
  }
}
