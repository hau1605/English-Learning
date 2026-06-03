import {
  Body,
  Controller,
  Delete,
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
import {
  BulkDeleteNotesDto,
  CreateNoteDto,
  NotesQueryDto,
  UpdateNoteDto,
} from "@/modules/notes/dto/note.dto";
import { NotesService } from "@/modules/notes/services/notes.service";

@ApiTags("notes")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("notes")
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Post()
  @ApiOperation({ summary: "Create a user note" })
  @ApiResponse({ status: 201, description: "Note created" })
  async create(
    @Req() req: Request & { user: { id: string } },
    @Body() dto: CreateNoteDto,
  ) {
    const note = await this.notesService.create(req.user.id, dto);
    return { message: "Note created", data: note };
  }

  @Get()
  @ApiOperation({ summary: "Get current user's notes" })
  @ApiResponse({ status: 200, description: "Notes retrieved" })
  async findAll(
    @Req() req: Request & { user: { id: string } },
    @Query() query: NotesQueryDto,
  ) {
    const result = await this.notesService.findAll(req.user.id, query);
    return {
      message: "Notes retrieved",
      data: result.data,
      meta: result.meta,
    };
  }

  @Get("tags")
  @ApiOperation({ summary: "Get current user's note tags" })
  @ApiResponse({ status: 200, description: "Tags retrieved" })
  async getTags(@Req() req: Request & { user: { id: string } }) {
    const tags = await this.notesService.getTags(req.user.id);
    return { message: "Tags retrieved", data: tags };
  }

  @Post("bulk-delete")
  @ApiOperation({ summary: "Soft delete multiple notes" })
  @ApiResponse({ status: 200, description: "Notes deleted" })
  async bulkDelete(
    @Req() req: Request & { user: { id: string } },
    @Body() dto: BulkDeleteNotesDto,
  ) {
    const result = await this.notesService.bulkDelete(req.user.id, dto);
    return { message: "Notes deleted", data: result };
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a note by ID" })
  @ApiResponse({ status: 200, description: "Note retrieved" })
  async findOne(
    @Req() req: Request & { user: { id: string } },
    @Param("id") id: string,
  ) {
    const note = await this.notesService.findOne(req.user.id, id);
    return { message: "Note retrieved", data: note };
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update a note" })
  @ApiResponse({ status: 200, description: "Note updated" })
  async update(
    @Req() req: Request & { user: { id: string } },
    @Param("id") id: string,
    @Body() dto: UpdateNoteDto,
  ) {
    const note = await this.notesService.update(req.user.id, id, dto);
    return { message: "Note updated", data: note };
  }

  @Post(":id/create-flashcard")
  @ApiOperation({ summary: "Create a flashcard from a vocabulary note" })
  @ApiResponse({ status: 201, description: "Flashcard created" })
  async createFlashcard(
    @Req() req: Request & { user: { id: string } },
    @Param("id") id: string,
  ) {
    const flashcard = await this.notesService.createFlashcardFromNote(
      req.user.id,
      id,
    );
    return { message: "Flashcard created", data: flashcard };
  }

  @Delete(":id")
  @ApiOperation({ summary: "Soft delete a note" })
  @ApiResponse({ status: 200, description: "Note deleted" })
  async delete(
    @Req() req: Request & { user: { id: string } },
    @Param("id") id: string,
  ) {
    await this.notesService.delete(req.user.id, id);
    return { message: "Note deleted" };
  }
}
