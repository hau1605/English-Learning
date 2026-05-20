import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from "@nestjs/swagger";
import { Public } from "@/modules/auth/decorators/public.decorator";
import { JwtAuthGuard } from "@/modules/auth/guards/jwt-auth.guard";
import { PermissionGuard } from "@/modules/permissions/guards/permission.guard";
import { Permissions } from "@/modules/permissions/decorators/permissions.decorator";
import { CrawlerService } from "./crawler.service";
import {
  ImportVocabularyDto,
  ImportTopicsDto,
  ImportGrammarDto,
  TriggerCrawlDto,
  TriggerGrammarCrawlDto,
  CrawlJobResponseDto,
  CrawlSourceResponseDto,
  CrawlLogResponseDto,
} from "./dto";

@ApiTags("Crawler")
@Controller("api/crawler")
export class CrawlerController {
  constructor(private readonly crawlerService: CrawlerService) {}

  @Post("vocabulary")
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permissions("crawler:create")
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Import vocabulary items from crawler service" })
  @ApiResponse({ status: 200, description: "Vocabulary imported successfully" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Forbidden" })
  async importVocabulary(@Body() dto: ImportVocabularyDto) {
    const result = await this.crawlerService.importVocabulary(dto.items);
    return {
      message: "Vocabulary imported successfully",
      itemsAdded: result.added,
      itemsUpdated: result.updated,
      itemsFailed: result.failed,
    };
  }

  @Post("topics")
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permissions("crawler:create")
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Import topics from crawler service" })
  @ApiResponse({ status: 200, description: "Topics imported successfully" })
  async importTopics(@Body() dto: ImportTopicsDto) {
    const result = await this.crawlerService.importTopics(dto.topics);
    return {
      message: "Topics imported successfully",
      topicsAdded: result.added,
      topicsUpdated: result.updated,
    };
  }

  @Post("grammar")
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permissions("crawler:create")
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Import grammar lessons from crawler service" })
  @ApiResponse({
    status: 200,
    description: "Grammar lessons imported successfully",
  })
  async importGrammar(@Body() dto: ImportGrammarDto) {
    const result = await this.crawlerService.importGrammar(dto.lessons);
    return {
      message: "Grammar lessons imported successfully",
      lessonsAdded: result.added,
      lessonsUpdated: result.updated,
    };
  }

  @Post("trigger/vocabulary")
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permissions("crawler:trigger")
  @ApiBearerAuth()
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: "Trigger vocabulary crawl job" })
  @ApiResponse({
    status: 202,
    description: "Crawl job queued",
    type: CrawlJobResponseDto,
  })
  async triggerVocabularyCrawl(@Body() dto: TriggerCrawlDto) {
    const job = await this.crawlerService.triggerVocabularyCrawl(dto);
    return {
      jobId: job.id || "",
      status: "queued",
      message: `Crawl job queued for ${dto.words.length} words`,
    };
  }

  @Post("trigger/grammar")
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permissions("crawler:trigger")
  @ApiBearerAuth()
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: "Trigger grammar crawl job" })
  @ApiResponse({
    status: 202,
    description: "Crawl job queued",
    type: CrawlJobResponseDto,
  })
  async triggerGrammarCrawl(@Body() dto: TriggerGrammarCrawlDto) {
    const job = await this.crawlerService.triggerGrammarCrawl(dto);
    return {
      jobId: job.id || "",
      status: "queued",
      message: `Grammar crawl job queued`,
    };
  }

  @Get("jobs")
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permissions("crawler:read")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get all crawl jobs" })
  @ApiResponse({ status: 200, description: "List of crawl jobs" })
  async getJobs(@Query("status") status?: string) {
    return this.crawlerService.getJobs(status);
  }

  @Get("jobs/:jobId")
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permissions("crawler:read")
  @ApiBearerAuth()
  @ApiParam({ name: "jobId", description: "Job ID" })
  @ApiOperation({ summary: "Get crawl job status" })
  @ApiResponse({ status: 200, description: "Job details" })
  async getJobStatus(@Param("jobId") jobId: string) {
    return this.crawlerService.getJobStatus(jobId);
  }

  @Get("sources")
  @Public()
  @ApiOperation({ summary: "Get available crawl sources" })
  @ApiResponse({
    status: 200,
    description: "List of crawl sources",
    type: [CrawlSourceResponseDto],
  })
  async getSources() {
    return this.crawlerService.getSources();
  }

  @Get("logs")
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permissions("crawler:read")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get crawl logs" })
  @ApiResponse({
    status: 200,
    description: "List of crawl logs",
    type: [CrawlLogResponseDto],
  })
  async getLogs(@Query("limit") limit?: number) {
    return this.crawlerService.getLogs(limit || 50);
  }

  @Get("stats")
  @Public()
  @ApiOperation({ summary: "Get crawler statistics" })
  @ApiResponse({ status: 200, description: "Crawler statistics" })
  async getStats() {
    return this.crawlerService.getStats();
  }
}
