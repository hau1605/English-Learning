import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import {
  BulkDeleteNotesDto,
  CreateNoteDto,
  NotesQueryDto,
  UpdateNoteDto,
  UserNoteSourceType,
} from "@/modules/notes/dto/note.dto";

@Injectable()
export class NotesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateNoteDto) {
    return this.prisma.userNote.create({
      data: {
        userId,
        title: dto.title,
        content: dto.content,
        type: dto.type ?? "CUSTOM",
        sourceType: dto.sourceType,
        sourceId: dto.sourceId,
        tags: this.normalizeTags(dto.tags),
        color: dto.color,
        isPinned: dto.isPinned ?? false,
        isArchived: dto.isArchived ?? false,
        reviewAt: dto.reviewAt ? new Date(dto.reviewAt) : undefined,
      },
    });
  }

  async findAll(userId: string, query: NotesQueryDto) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = {
      userId,
      deletedAt: null,
      isArchived: query.isArchived ?? false,
    };

    if (query.type) where.type = query.type;
    if (query.sourceType) where.sourceType = query.sourceType;
    if (query.sourceId) where.sourceId = query.sourceId;
    if (typeof query.isPinned === "boolean") where.isPinned = query.isPinned;
    if (query.tag) where.tags = { has: query.tag.trim().toLowerCase() };
    if (query.q) {
      where.OR = [
        { title: { contains: query.q, mode: "insensitive" } },
        { content: { contains: query.q, mode: "insensitive" } },
        { tags: { has: query.q.trim().toLowerCase() } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.userNote.findMany({
        where,
        orderBy: [{ isPinned: "desc" }, { updatedAt: "desc" }],
        skip,
        take: limit,
      }),
      this.prisma.userNote.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
    };
  }

  async findOne(userId: string, id: string) {
    const note = await this.prisma.userNote.findFirst({
      where: { id, userId, deletedAt: null },
    });

    if (!note) {
      throw new NotFoundException("Note not found");
    }

    return note;
  }

  async update(userId: string, id: string, dto: UpdateNoteDto) {
    await this.findOne(userId, id);

    return this.prisma.userNote.update({
      where: { id },
      data: {
        title: dto.title,
        content: dto.content,
        type: dto.type,
        sourceType: dto.sourceType,
        sourceId: dto.sourceId,
        tags: dto.tags ? this.normalizeTags(dto.tags) : undefined,
        color: dto.color,
        isPinned: dto.isPinned,
        isArchived: dto.isArchived,
        reviewAt: dto.reviewAt ? new Date(dto.reviewAt) : undefined,
      },
    });
  }

  async delete(userId: string, id: string) {
    await this.findOne(userId, id);

    return this.prisma.userNote.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isArchived: true,
      },
    });
  }

  async bulkDelete(userId: string, dto: BulkDeleteNotesDto) {
    return this.prisma.userNote.updateMany({
      where: {
        userId,
        id: { in: dto.ids },
        deletedAt: null,
      },
      data: {
        deletedAt: new Date(),
        isArchived: true,
      },
    });
  }

  async getTags(userId: string) {
    const notes = await this.prisma.userNote.findMany({
      where: { userId, deletedAt: null },
      select: { tags: true },
    });

    const tags = [...new Set(notes.flatMap((note) => note.tags))].sort();
    return tags;
  }

  async createFlashcardFromNote(userId: string, id: string) {
    const note = await this.findOne(userId, id);

    if (
      note.sourceType !== UserNoteSourceType.VOCABULARY ||
      !note.sourceId
    ) {
      throw new BadRequestException(
        "Only notes linked to a vocabulary item can create a flashcard",
      );
    }

    const vocabulary = await this.prisma.vocabulary.findUnique({
      where: { id: note.sourceId },
    });

    if (!vocabulary) {
      throw new NotFoundException("Linked vocabulary not found");
    }

    return this.prisma.flashcard.create({
      data: {
        vocabularyId: vocabulary.id,
        frontContent: note.title,
        backContent: note.content,
        hint: note.tags.length ? note.tags.join(", ") : undefined,
      },
      include: {
        vocabulary: {
          include: {
            topic: { select: { id: true, name: true } },
          },
        },
      },
    });
  }

  private normalizeTags(tags?: string[]) {
    return [
      ...new Set(
        (tags || [])
          .map((tag) => tag.trim().toLowerCase())
          .filter(Boolean)
          .slice(0, 20),
      ),
    ];
  }
}
