import { Logger } from "@nestjs/common";
import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Job } from "bullmq";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import { HttpService } from "@nestjs/axios";

interface VocabularyCrawlJobData {
  words: string[];
  source: string;
  pushToBackend: boolean;
  result?: {
    itemsAdded: number;
    itemsUpdated: number;
    itemsFailed: number;
    duration: number;
  };
}

interface GrammarCrawlJobData {
  categories: string[];
  pushToBackend: boolean;
  result?: {
    itemsAdded: number;
    itemsUpdated: number;
    itemsFailed: number;
    duration: number;
  };
}

interface CrawlResult {
  success: boolean;
  source: string;
  items: any[];
  items_added: number;
  items_updated: number;
  items_failed: number;
  errors: string[];
  duration_ms: number;
}

@Processor("crawler")
export class CrawlerProcessor extends WorkerHost {
  private readonly logger = new Logger(CrawlerProcessor.name);
  private readonly CRAWLER_API_URL =
    process.env.CRAWLER_API_URL || "http://localhost:8000";

  constructor(
    @InjectQueue("crawler")
    private crawlerQueue: Queue,
    private httpService: HttpService,
  ) {
    super();
  }

  async process(
    job: Job<VocabularyCrawlJobData | GrammarCrawlJobData>,
  ): Promise<any> {
    this.logger.log(`Processing job ${job.id}: ${job.name}`);

    try {
      if (job.name === "vocabulary-crawl") {
        return await this.processVocabularyCrawl(
          job as Job<VocabularyCrawlJobData>,
        );
      } else if (job.name === "grammar-crawl") {
        return await this.processGrammarCrawl(job as Job<GrammarCrawlJobData>);
      }
    } catch (error) {
      this.logger.error(`Job ${job.id} failed:`, error);
      throw error;
    }
  }

  private async processVocabularyCrawl(
    job: Job<VocabularyCrawlJobData>,
  ): Promise<CrawlResult> {
    const { words, source } = job.data;
    const startTime = Date.now();

    this.logger.log(
      `Starting vocabulary crawl for ${words.length} words from source: ${source}`,
    );

    try {
      // Call the backend's import endpoint directly with crawled data
      // First crawl the data from Python crawler service
      const crawlResponse = await this.httpService.axiosRef.post<any>(
        `${this.CRAWLER_API_URL}/api/v1/crawl/vocabulary/sync`,
        {
          words,
          source,
          pushToBackend: false,
        },
        { timeout: 300000 },
      );

      // Then push the results to backend
      const items = crawlResponse.data.items || [];
      if (items.length > 0) {
        await this.httpService.axiosRef.post(
          `${process.env.API_URL || "http://localhost:3000"}/api/crawler/vocabulary`,
          { items },
        );
      }

      const result = crawlResponse.data;
      const duration = Date.now() - startTime;

      this.logger.log(
        `Vocabulary crawl completed: ${result.items_added || 0} added, ` +
          `${result.items_updated || 0} updated, ${result.items_failed || 0} failed, ` +
          `duration: ${duration}ms`,
      );

      await job.updateProgress(100);
      await job.updateData({
        ...job.data,
        result: {
          itemsAdded: result.items_added || 0,
          itemsUpdated: result.items_updated || 0,
          itemsFailed: result.items_failed || 0,
          duration,
        },
      });

      return result;
    } catch (error) {
      this.logger.error(`Vocabulary crawl failed:`, error);
      throw error;
    }
  }

  private async processGrammarCrawl(
    job: Job<GrammarCrawlJobData>,
  ): Promise<CrawlResult> {
    const { categories } = job.data;
    const startTime = Date.now();

    this.logger.log(
      `Starting grammar crawl for categories: ${categories.join(", ")}`,
    );

    try {
      // Call the backend's grammar import endpoint
      const crawlResponse = await this.httpService.axiosRef.post<any>(
        `${this.CRAWLER_API_URL}/api/v1/crawl/grammar/sync`,
        {
          categories,
          pushToBackend: false,
        },
        { timeout: 300000 },
      );

      // Then push the results to backend
      const lessons = crawlResponse.data.items || [];
      if (lessons.length > 0) {
        await this.httpService.axiosRef.post(
          `${process.env.API_URL || "http://localhost:3000"}/api/crawler/grammar`,
          { lessons },
        );
      }

      const result = crawlResponse.data;
      const duration = Date.now() - startTime;

      this.logger.log(
        `Grammar crawl completed: ${result.items_added || 0} added, ` +
          `${result.items_updated || 0} updated, ` +
          `duration: ${duration}ms`,
      );

      await job.updateProgress(100);
      await job.updateData({
        ...job.data,
        result: {
          itemsAdded: result.items_added || 0,
          itemsUpdated: result.items_updated || 0,
          itemsFailed: result.items_failed || 0,
          duration,
        },
      });

      return result;
    } catch (error) {
      this.logger.error(`Grammar crawl failed:`, error);
      throw error;
    }
  }
}
