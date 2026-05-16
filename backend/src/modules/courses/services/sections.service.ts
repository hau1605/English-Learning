import { Injectable } from '@nestjs/common';
import { SectionsRepository } from '../repositories/sections.repository';
import { CreateSectionDto, UpdateSectionDto } from '../dto/section.dto';

@Injectable()
export class CourseSectionsService {
  constructor(private readonly sectionsRepository: SectionsRepository) {}

  async findAllByCourse(courseId: string) {
    return this.sectionsRepository.findAllByCourse(courseId);
  }

  async findById(id: string) {
    return this.sectionsRepository.findById(id);
  }

  async create(courseId: string, dto: CreateSectionDto) {
    return this.sectionsRepository.create(courseId, dto);
  }

  async update(id: string, dto: UpdateSectionDto) {
    return this.sectionsRepository.update(id, dto);
  }

  async delete(id: string): Promise<void> {
    return this.sectionsRepository.delete(id);
  }

  async reorder(courseId: string, orderedIds: string[]) {
    const updates = orderedIds.map((id, index) =>
      this.sectionsRepository.update(id, { orderIndex: index })
    );
    await Promise.all(updates);
    return this.findAllByCourse(courseId);
  }
}
