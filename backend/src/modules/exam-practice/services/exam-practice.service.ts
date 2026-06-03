import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { PointsService } from "@/modules/points/points.service";
import {
  AddPracticeSetQuestionDto,
  CreateExamPassageDto,
  CreateExamQuestionDto,
  CreatePracticeSetDto,
  ExamPracticeQueryDto,
  ReportExamQuestionDto,
  SavePracticeAnswersDto,
  StartPracticeAttemptDto,
} from "@/modules/exam-practice/dto/exam-practice.dto";

@Injectable()
export class ExamPracticeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pointsService: PointsService,
  ) {}

  async getExams() {
    return this.prisma.exam.findMany({
      where: { isActive: true },
      orderBy: { orderIndex: "asc" },
      include: {
        sections: { orderBy: { orderIndex: "asc" } },
      },
    });
  }

  async getPracticeSets(query: ExamPracticeQueryDto) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;
    const where: any = {
      status: "PUBLISHED",
      deletedAt: null,
    };

    if (query.examId) where.examId = query.examId;
    if (query.sectionId) where.sectionId = query.sectionId;
    if (query.type) where.type = query.type;
    if (query.difficulty) where.difficulty = query.difficulty;
    if (query.topic) where.topic = { contains: query.topic, mode: "insensitive" };

    const [data, total] = await Promise.all([
      this.prisma.examPracticeSet.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        skip,
        take: limit,
        include: {
          exam: { select: { id: true, code: true, name: true } },
          section: { select: { id: true, code: true, name: true, partNumber: true } },
          _count: { select: { questions: true, attempts: true } },
        },
      }),
      this.prisma.examPracticeSet.count({ where }),
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

  async getPracticeSet(id: string) {
    const practiceSet = await this.prisma.examPracticeSet.findFirst({
      where: { id, deletedAt: null },
      include: {
        exam: true,
        section: true,
        questions: {
          orderBy: { orderIndex: "asc" },
          include: {
            question: {
              include: {
                passage: true,
                options: { orderBy: { orderIndex: "asc" } },
              },
            },
          },
        },
      },
    });

    if (!practiceSet) {
      throw new NotFoundException("Practice set not found");
    }

    return practiceSet;
  }

  async startAttempt(
    userId: string,
    practiceSetId: string,
    dto: StartPracticeAttemptDto,
  ) {
    const practiceSet = await this.getPracticeSet(practiceSetId);

    if (practiceSet.status !== "PUBLISHED") {
      throw new BadRequestException("Practice set is not published");
    }

    if (practiceSet.questions.length === 0) {
      throw new BadRequestException("Practice set has no questions");
    }

    const startedAt = new Date();
    const expiresAt = practiceSet.recommendedMinutes
      ? new Date(startedAt.getTime() + practiceSet.recommendedMinutes * 60_000)
      : undefined;

    return this.prisma.$transaction(async (tx) => {
      const attempt = await tx.examPracticeAttempt.create({
        data: {
          userId,
          practiceSetId,
          mode: dto.mode || "PRACTICE",
          startedAt,
          expiresAt,
          totalQuestions: practiceSet.questions.length,
        },
      });

      await tx.examPracticeAnswer.createMany({
        data: practiceSet.questions.map((item: any) => {
          const question = item.question;
          const options = question.options.map((option: any) => ({
            id: option.id,
            content: option.content,
            orderIndex: option.orderIndex,
          }));
          const correctOptionIds = question.options
            .filter((option: any) => option.isCorrect)
            .map((option: any) => option.id);

          return {
            attemptId: attempt.id,
            questionId: question.id,
            questionSnapshot: {
              id: question.id,
              code: question.code,
              type: question.type,
              prompt: question.prompt,
              passage: question.passage
                ? {
                    id: question.passage.id,
                    title: question.passage.title,
                    content: question.passage.content,
                  }
                : null,
              difficulty: question.difficulty,
              topic: question.topic,
              skillTag: question.skillTag,
              knowledgeTags: question.knowledgeTags,
            },
            optionSnapshot: options,
            correctAnswerSnapshot: {
              selectedOptionIds: correctOptionIds,
            },
            explanationSnapshot: question.explanation,
          };
        }),
      });

      return this.getAttemptForUser(userId, attempt.id, tx);
    });
  }

  async getAttempt(userId: string, attemptId: string) {
    return this.getAttemptForUser(userId, attemptId);
  }

  async saveAnswers(userId: string, attemptId: string, dto: SavePracticeAnswersDto) {
    const attempt = await this.prisma.examPracticeAttempt.findFirst({
      where: { id: attemptId, userId },
    });

    if (!attempt) {
      throw new NotFoundException("Attempt not found");
    }

    if (attempt.status !== "IN_PROGRESS") {
      throw new BadRequestException("Submitted attempts cannot be changed");
    }

    await this.prisma.$transaction(
      dto.answers.map((answer) =>
        this.prisma.examPracticeAnswer.updateMany({
          where: {
            attemptId,
            questionId: answer.questionId,
          },
          data: {
            selectedOptionIds: answer.selectedOptionIds || [],
            textAnswer: answer.textAnswer,
            markedForReview: answer.markedForReview ?? false,
            answeredAt: new Date(),
          },
        }),
      ),
    );

    return this.getAttemptForUser(userId, attemptId);
  }

  async submitAttempt(userId: string, attemptId: string) {
    const attempt = await this.getAttemptForUser(userId, attemptId);

    if (attempt.status !== "IN_PROGRESS") {
      throw new BadRequestException("Attempt has already been submitted");
    }

    let totalCorrect = 0;
    let totalPoints = 0;
    let earnedPoints = 0;
    const weakTags = new Map<string, number>();

    await this.prisma.$transaction(async (tx) => {
      for (const answer of attempt.answers) {
        const correctSnapshot = answer.correctAnswerSnapshot as any;
        const correctOptionIds = correctSnapshot?.selectedOptionIds || [];
        const selectedOptionIds = answer.selectedOptionIds || [];
        const isCorrect = this.sameStringSet(selectedOptionIds, correctOptionIds);
        const setItem = attempt.practiceSet.questions.find(
          (item: any) => item.questionId === answer.questionId,
        );
        const points = Number(setItem?.points || 1);
        totalPoints += points;
        if (isCorrect) {
          totalCorrect += 1;
          earnedPoints += points;
        } else {
          const snapshot = answer.questionSnapshot as any;
          for (const tag of snapshot?.knowledgeTags || []) {
            weakTags.set(tag, (weakTags.get(tag) || 0) + 1);
          }
          if (snapshot?.skillTag) {
            weakTags.set(snapshot.skillTag, (weakTags.get(snapshot.skillTag) || 0) + 1);
          }
        }

        await tx.examPracticeAnswer.update({
          where: { id: answer.id },
          data: {
            isCorrect,
            pointsEarned: isCorrect ? points : 0,
          },
        });
      }

      const scorePercent =
        totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 10000) / 100 : 0;
      const now = new Date();
      const timeSpentSeconds = Math.max(
        0,
        Math.round((now.getTime() - new Date(attempt.startedAt).getTime()) / 1000),
      );

      await tx.examPracticeAttempt.update({
        where: { id: attempt.id },
        data: {
          status: "SUBMITTED",
          submittedAt: now,
          totalCorrect,
          scorePercent,
          timeSpentSeconds,
          analysis: {
            weakTags: [...weakTags.entries()]
              .sort((a, b) => b[1] - a[1])
              .map(([tag, count]) => ({ tag, count })),
          },
        },
      });

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      await tx.userDailyStat.upsert({
        where: { userId_date: { userId, date: today } },
        create: {
          userId,
          date: today,
          quizzesCompleted: 1,
          xpEarned: this.getXpForScore(scorePercent),
        },
        update: {
          quizzesCompleted: { increment: 1 },
          xpEarned: { increment: this.getXpForScore(scorePercent) },
        },
      });
    });

    const xp = this.getXpForScore(
      totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 10000) / 100 : 0,
    );
    if (xp > 0) {
      await this.pointsService.awardXp(userId, xp, "exam_practice");
    }

    return this.getAttemptForUser(userId, attemptId);
  }

  async getHistory(userId: string, params: { page?: number; limit?: number }) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 20));
    const skip = (page - 1) * limit;
    const where = { userId };

    const [data, total] = await Promise.all([
      this.prisma.examPracticeAttempt.findMany({
        where,
        orderBy: { startedAt: "desc" },
        skip,
        take: limit,
        include: {
          practiceSet: {
            include: {
              exam: { select: { code: true, name: true } },
              section: { select: { code: true, name: true, partNumber: true } },
            },
          },
        },
      }),
      this.prisma.examPracticeAttempt.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getWrongQuestions(userId: string) {
    return this.prisma.examPracticeAnswer.findMany({
      where: {
        isCorrect: false,
        attempt: {
          userId,
          status: "SUBMITTED",
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 100,
      include: {
        attempt: {
          select: {
            id: true,
            submittedAt: true,
            practiceSet: { select: { id: true, title: true } },
          },
        },
      },
    });
  }

  async reportQuestion(
    userId: string,
    questionId: string,
    dto: ReportExamQuestionDto,
  ) {
    const question = await this.prisma.examQuestion.findFirst({
      where: { id: questionId, deletedAt: null },
    });
    if (!question) {
      throw new NotFoundException("Question not found");
    }

    return this.prisma.examQuestionReport.create({
      data: {
        userId,
        questionId,
        reason: dto.reason,
        message: dto.message,
      },
    });
  }

  async createPassage(dto: CreateExamPassageDto) {
    return this.prisma.examPassage.create({
      data: {
        examId: dto.examId,
        sectionId: dto.sectionId,
        title: dto.title,
        content: dto.content,
        passageType: dto.passageType,
        topic: dto.topic,
        difficulty: dto.difficulty || "MEDIUM",
        source: dto.source,
        status: dto.status || "DRAFT",
      },
    });
  }

  async createQuestion(dto: CreateExamQuestionDto) {
    const correctCount = dto.options.filter((option) => option.isCorrect).length;
    if (correctCount === 0) {
      throw new BadRequestException("Question must have at least one correct option");
    }
    if (dto.type === "SINGLE_CHOICE" && correctCount !== 1) {
      throw new BadRequestException("Single choice question must have one correct option");
    }

    return this.prisma.examQuestion.create({
      data: {
        code: dto.code,
        examId: dto.examId,
        sectionId: dto.sectionId,
        passageId: dto.passageId,
        type: dto.type,
        prompt: dto.prompt,
        explanation: dto.explanation,
        difficulty: dto.difficulty || "MEDIUM",
        cefrLevel: dto.cefrLevel,
        topic: dto.topic,
        skillTag: dto.skillTag,
        knowledgeTags: this.normalizeTags(dto.knowledgeTags),
        source: dto.source,
        status: dto.status || "DRAFT",
        audioUrl: dto.audioUrl,
        imageUrl: dto.imageUrl,
        options: {
          create: dto.options.map((option, index) => ({
            content: option.content,
            isCorrect: option.isCorrect ?? false,
            orderIndex: option.orderIndex ?? index,
            explanation: option.explanation,
          })),
        },
      },
      include: { options: true },
    });
  }

  async createPracticeSet(dto: CreatePracticeSetDto) {
    return this.prisma.examPracticeSet.create({
      data: {
        examId: dto.examId,
        sectionId: dto.sectionId,
        title: dto.title,
        description: dto.description,
        type: dto.type || "PRACTICE_SET",
        recommendedMinutes: dto.recommendedMinutes,
        difficulty: dto.difficulty || "MEDIUM",
        topic: dto.topic,
        showExplanationImmediately: dto.showExplanationImmediately ?? false,
        allowRetake: dto.allowRetake ?? true,
        status: dto.status || "DRAFT",
      },
    });
  }

  async addQuestionToPracticeSet(
    practiceSetId: string,
    dto: AddPracticeSetQuestionDto,
  ) {
    return this.prisma.examPracticeSetQuestion.upsert({
      where: {
        practiceSetId_questionId: {
          practiceSetId,
          questionId: dto.questionId,
        },
      },
      update: {
        orderIndex: dto.orderIndex,
        points: dto.points,
      },
      create: {
        practiceSetId,
        questionId: dto.questionId,
        orderIndex: dto.orderIndex || 0,
        points: dto.points || 1,
      },
    });
  }

  private async getAttemptForUser(userId: string, attemptId: string, tx?: any) {
    const client = tx || this.prisma;
    const attempt = await client.examPracticeAttempt.findFirst({
      where: { id: attemptId, userId },
      include: {
        practiceSet: {
          include: {
            exam: true,
            section: true,
            questions: {
              orderBy: { orderIndex: "asc" },
              select: { questionId: true, points: true, orderIndex: true },
            },
          },
        },
        answers: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!attempt) {
      throw new NotFoundException("Attempt not found");
    }

    return attempt;
  }

  private sameStringSet(a: string[], b: string[]) {
    if (a.length !== b.length) return false;
    const left = [...a].sort();
    const right = [...b].sort();
    return left.every((value, index) => value === right[index]);
  }

  private getXpForScore(scorePercent: number) {
    if (scorePercent <= 0) return 0;
    return Math.max(5, Math.round(10 + scorePercent * 0.4));
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
