import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "@/modules/auth/guards/jwt-auth.guard";
import { PermissionGuard } from "@/modules/permissions/guards/permission.guard";
import { Permissions } from "@/modules/permissions/decorators/permissions.decorator";
import { Public } from "@/modules/auth/decorators/public.decorator";
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
import { ExamPracticeService } from "@/modules/exam-practice/services/exam-practice.service";

@ApiTags("exam-practice")
@Controller("exam-practice")
export class ExamPracticeController {
  constructor(private readonly examPracticeService: ExamPracticeService) {}

  @Public()
  @Get("exams")
  @ApiOperation({ summary: "Get active exam catalog" })
  @ApiResponse({ status: 200, description: "Exams retrieved" })
  async getExams() {
    const exams = await this.examPracticeService.getExams();
    return { message: "Exams retrieved", data: exams };
  }

  @Public()
  @Get("practice-sets")
  @ApiOperation({ summary: "Get published practice sets" })
  @ApiResponse({ status: 200, description: "Practice sets retrieved" })
  async getPracticeSets(@Query() query: ExamPracticeQueryDto) {
    const result = await this.examPracticeService.getPracticeSets(query);
    return { message: "Practice sets retrieved", data: result.data, meta: result.meta };
  }

  @Public()
  @Get("practice-sets/:id")
  @ApiOperation({ summary: "Get practice set detail" })
  @ApiResponse({ status: 200, description: "Practice set retrieved" })
  async getPracticeSet(@Param("id") id: string) {
    const practiceSet = await this.examPracticeService.getPracticeSet(id);
    return { message: "Practice set retrieved", data: practiceSet };
  }

  @Post("practice-sets/:id/start")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Start a practice attempt" })
  @ApiResponse({ status: 201, description: "Attempt started" })
  async startAttempt(
    @Req() req: Request & { user: { id: string } },
    @Param("id") id: string,
    @Body() dto: StartPracticeAttemptDto,
  ) {
    const attempt = await this.examPracticeService.startAttempt(req.user.id, id, dto);
    return { message: "Attempt started", data: attempt };
  }

  @Get("attempts/:id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get current user's attempt" })
  @ApiResponse({ status: 200, description: "Attempt retrieved" })
  async getAttempt(
    @Req() req: Request & { user: { id: string } },
    @Param("id") id: string,
  ) {
    const attempt = await this.examPracticeService.getAttempt(req.user.id, id);
    return { message: "Attempt retrieved", data: attempt };
  }

  @Patch("attempts/:id/answers")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Save draft answers for an attempt" })
  @ApiResponse({ status: 200, description: "Answers saved" })
  async saveAnswers(
    @Req() req: Request & { user: { id: string } },
    @Param("id") id: string,
    @Body() dto: SavePracticeAnswersDto,
  ) {
    const attempt = await this.examPracticeService.saveAnswers(req.user.id, id, dto);
    return { message: "Answers saved", data: attempt };
  }

  @Post("attempts/:id/submit")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Submit and grade an attempt" })
  @ApiResponse({ status: 200, description: "Attempt submitted" })
  async submitAttempt(
    @Req() req: Request & { user: { id: string } },
    @Param("id") id: string,
  ) {
    const attempt = await this.examPracticeService.submitAttempt(req.user.id, id);
    return { message: "Attempt submitted", data: attempt };
  }

  @Get("history")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get practice attempt history" })
  @ApiResponse({ status: 200, description: "History retrieved" })
  async getHistory(
    @Req() req: Request & { user: { id: string } },
    @Query("page") page?: number,
    @Query("limit") limit?: number,
  ) {
    const result = await this.examPracticeService.getHistory(req.user.id, {
      page,
      limit,
    });
    return { message: "History retrieved", data: result.data, meta: result.meta };
  }

  @Get("wrong-questions")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get recently missed questions" })
  @ApiResponse({ status: 200, description: "Wrong questions retrieved" })
  async getWrongQuestions(@Req() req: Request & { user: { id: string } }) {
    const questions = await this.examPracticeService.getWrongQuestions(req.user.id);
    return { message: "Wrong questions retrieved", data: questions };
  }

  @Post("questions/:id/report")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Report a question issue" })
  @ApiResponse({ status: 201, description: "Question report created" })
  async reportQuestion(
    @Req() req: Request & { user: { id: string } },
    @Param("id") id: string,
    @Body() dto: ReportExamQuestionDto,
  ) {
    const report = await this.examPracticeService.reportQuestion(req.user.id, id, dto);
    return { message: "Question report created", data: report };
  }

  @Post("admin/passages")
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permissions("exam.manage")
  @ApiBearerAuth()
  async createPassage(@Body() dto: CreateExamPassageDto) {
    const passage = await this.examPracticeService.createPassage(dto);
    return { message: "Passage created", data: passage };
  }

  @Post("admin/questions")
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permissions("exam.manage")
  @ApiBearerAuth()
  async createQuestion(@Body() dto: CreateExamQuestionDto) {
    const question = await this.examPracticeService.createQuestion(dto);
    return { message: "Question created", data: question };
  }

  @Post("admin/practice-sets")
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permissions("exam.manage")
  @ApiBearerAuth()
  async createPracticeSet(@Body() dto: CreatePracticeSetDto) {
    const practiceSet = await this.examPracticeService.createPracticeSet(dto);
    return { message: "Practice set created", data: practiceSet };
  }

  @Post("admin/practice-sets/:id/questions")
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permissions("exam.manage")
  @ApiBearerAuth()
  async addQuestionToPracticeSet(
    @Param("id") id: string,
    @Body() dto: AddPracticeSetQuestionDto,
  ) {
    const item = await this.examPracticeService.addQuestionToPracticeSet(id, dto);
    return { message: "Question added to practice set", data: item };
  }
}
