import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { VocabularyRepository } from "@/modules/vocabulary/repositories/vocabulary.repository";
import * as XLSX from "xlsx";

@Injectable()
export class VocabularyService {
  constructor(
    private readonly vocabularyRepository: VocabularyRepository,
  ) {}

  async getTopics() {
    return this.vocabularyRepository.findAllTopics();
  }

  async getTopicsAdmin() {
    return this.vocabularyRepository.findAllTopicsAdmin();
  }

  async getTopicBySlug(slug: string) {
    return this.vocabularyRepository.findTopicBySlug(slug);
  }

  async getVocabulariesByTopic(topicId: string) {
    return this.vocabularyRepository.findVocabulariesByTopic(topicId);
  }

  async searchVocabularies(query: string, limit: number = 20) {
    return this.vocabularyRepository.search(query, limit);
  }

  async getVocabularyById(id: string) {
    return this.vocabularyRepository.findById(id);
  }

  async getVocabulariesAdmin(params: {
    page?: number;
    limit?: number;
    search?: string;
    difficulty?: number;
  }) {
    return this.vocabularyRepository.findAllWithPagination(params);
  }

  async createTopic(data: {
    name: string;
    slug: string;
    description?: string;
    icon?: string;
  }) {
    return this.vocabularyRepository.createTopic(data);
  }

  async updateTopic(
    id: string,
    data: { name?: string; description?: string; icon?: string },
  ) {
    const topic = await this.vocabularyRepository.findTopicById(id);
    if (!topic) {
      throw new NotFoundException("Topic not found");
    }

    return this.vocabularyRepository.updateTopic(id, data);
  }

  async deleteTopic(id: string) {
    const topic = await this.vocabularyRepository.findTopicById(id);
    if (!topic) {
      throw new NotFoundException("Topic not found");
    }

    return this.vocabularyRepository.deleteTopic(id);
  }

  async createVocabulary(data: {
    topicId: string;
    word: string;
    pronunciation?: string;
    meaning: string;
    example?: string;
    exampleTranslation?: string;
    audioUrl?: string;
    imageUrl?: string;
    difficulty?: number;
    partOfSpeech?: string;
  }) {
    return this.vocabularyRepository.createVocabulary(data);
  }

  async updateVocabulary(
    id: string,
    data: {
      word?: string;
      pronunciation?: string;
      meaning?: string;
      example?: string;
      exampleTranslation?: string;
      audioUrl?: string;
      imageUrl?: string;
      difficulty?: number;
      partOfSpeech?: string;
    },
  ) {
    const vocabulary = await this.vocabularyRepository.findById(id);
    if (!vocabulary) {
      throw new NotFoundException("Vocabulary not found");
    }

    return this.vocabularyRepository.updateVocabulary(id, data);
  }

  async deleteVocabulary(id: string) {
    const vocabulary = await this.vocabularyRepository.findById(id);
    if (!vocabulary) {
      throw new NotFoundException("Vocabulary not found");
    }

    return this.vocabularyRepository.deleteVocabulary(id);
  }

  async createBulkVocabulary(
    data: Array<{
      topicId: string;
      word: string;
      pronunciation?: string;
      meaning: string;
      example?: string;
      exampleTranslation?: string;
      audioUrl?: string;
      imageUrl?: string;
      difficulty?: number;
      partOfSpeech?: string;
    }>,
  ) {
    return this.vocabularyRepository.createBulkVocabulary(data);
  }

  // ========== IMPORT / EXPORT METHODS ==========

  async exportVocabulary(params: {
    topicId?: string;
    format?: "csv" | "xlsx" | "json";
    difficulty?: number;
  }): Promise<{ data: any; filename: string; mimeType: string }> {
    const { topicId, format = "csv", difficulty } = params;

    const where: any = {};
    if (topicId) {
      where.topicId = topicId;
    }
    if (difficulty) {
      where.difficulty = difficulty;
    }

    const vocabularies =
      await this.vocabularyRepository.findVocabulariesForExport(where);

    const exportData = vocabularies.map((v) => ({
      word: v.word,
      pronunciation: v.pronunciation || "",
      meaning: v.meaning,
      partOfSpeech: v.partOfSpeech || "",
      example: v.example || "",
      exampleTranslation: v.exampleTranslation || "",
      difficulty: v.difficulty,
      topicName: v.topic?.name || "",
    }));

    const timestamp = new Date().toISOString().split("T")[0];
    let data: any;
    let filename: string;
    let mimeType: string;

    switch (format) {
      case "xlsx":
        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Vocabulary");
        data = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
        filename = `vocabulary-export-${timestamp}.xlsx`;
        mimeType =
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
        break;

      case "json":
        data = JSON.stringify(exportData, null, 2);
        filename = `vocabulary-export-${timestamp}.json`;
        mimeType = "application/json";
        break;

      case "csv":
      default:
        const csvContent = this.convertToCSV(exportData);
        data = Buffer.from(csvContent, "utf-8");
        filename = `vocabulary-export-${timestamp}.csv`;
        mimeType = "text/csv;charset=utf-8";
        break;
    }

    return { data, filename, mimeType };
  }

  private convertToCSV(data: any[]): string {
    if (data.length === 0) return "";

    const headers = Object.keys(data[0]);
    const csvRows = [];

    csvRows.push(headers.join(","));

    for (const row of data) {
      const values = headers.map((header) => {
        const value = row[header] ?? "";
        const escaped = String(value).replace(/"/g, '""');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(","));
    }

    return csvRows.join("\n");
  }

  async importVocabulary(params: {
    fileBuffer: Buffer;
    topicId: string;
    defaultDifficulty?: number;
    createTopicIfNotExists?: string;
  }): Promise<{
    success: number;
    failed: number;
    errors: Array<{ row: number; word: string; error: string }>;
  }> {
    const { fileBuffer, topicId, defaultDifficulty, createTopicIfNotExists } =
      params;

    let topic = await this.vocabularyRepository.findTopicById(topicId);

    if (!topic && createTopicIfNotExists) {
      const slug = this.slugify(createTopicIfNotExists);
      const createdTopic = await this.vocabularyRepository.createTopic({
        name: createTopicIfNotExists,
        slug,
      });
      topic = {
        id: createdTopic.id,
        name: createdTopic.name,
        slug: createdTopic.slug,
        description: createdTopic.description,
        icon: createdTopic.icon,
        vocabularies: [],
      };
    }

    if (!topic) {
      throw new NotFoundException("Topic not found");
    }

    const parseResult = this.parseFile(fileBuffer);
    const vocabularies = parseResult.data;
    const parseErrors = parseResult.errors;

    if (vocabularies.length === 0) {
      throw new BadRequestException("No valid vocabulary found in file");
    }

    const validVocabularies: Array<{
      topicId: string;
      word: string;
      pronunciation?: string;
      meaning: string;
      example?: string;
      exampleTranslation?: string;
      partOfSpeech?: string;
      difficulty: number;
    }> = [];

    const importErrors: Array<{ row: number; word: string; error: string }> =
      [];

    vocabularies.forEach((item, index) => {
      const rowNum = index + 2;

      if (!item.word || !item.meaning) {
        importErrors.push({
          row: rowNum,
          word: item.word || "",
          error: "Missing required fields (word, meaning)",
        });
        return;
      }

      validVocabularies.push({
        topicId: topic.id,
        word: String(item.word).trim(),
        pronunciation: item.pronunciation
          ? String(item.pronunciation).trim()
          : undefined,
        meaning: String(item.meaning).trim(),
        example: item.example ? String(item.example).trim() : undefined,
        exampleTranslation: item.exampleTranslation
          ? String(item.exampleTranslation).trim()
          : undefined,
        partOfSpeech: item.partOfSpeech
          ? String(item.partOfSpeech).trim()
          : undefined,
        difficulty:
          defaultDifficulty || (item.difficulty ? Number(item.difficulty) : 1),
      });
    });

    if (parseErrors.length > 0) {
      importErrors.push(
        ...parseErrors.map((e) => ({ row: 0, word: "", error: e })),
      );
    }

    let successCount = 0;
    if (validVocabularies.length > 0) {
      try {
        await this.vocabularyRepository.createBulkVocabulary(validVocabularies);
        successCount = validVocabularies.length;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        importErrors.push({
          row: 0,
          word: "",
          error: `Database error: ${message}`,
        });
      }
    }

    return {
      success: successCount,
      failed: importErrors.length,
      errors: importErrors,
    };
  }

  private parseFile(buffer: Buffer): { data: any[]; errors: string[] } {
    const errors: string[] = [];

    try {
      const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

      if (jsonData.length === 0) {
        return { data: [], errors: ["File is empty or has no data"] };
      }

      const normalizedData = jsonData.map((row: any) => {
        const normalized: any = {};

        const keyMap: Record<string, string[]> = {
          word: [
            "word",
            "Word",
            "WORD",
            "vocabulary",
            "Vocabulary",
            "từ",
            "term",
            "Term",
          ],
          pronunciation: [
            "pronunciation",
            "Pronunciation",
            "PRONUNCIATION",
            "phát âm",
            "phonetic",
            "Phonetic",
          ],
          meaning: [
            "meaning",
            "Meaning",
            "MEANING",
            "nghĩa",
            "definition",
            "Definition",
            "dịch",
          ],
          partOfSpeech: [
            "partOfSpeech",
            "part_of_speech",
            "pos",
            "POS",
            "wordType",
            "word_type",
            "loại từ",
            "type",
          ],
          example: [
            "example",
            "Example",
            "EXAMPLE",
            "ví dụ",
            "sentence",
            "Sentence",
            "câu",
          ],
          exampleTranslation: [
            "exampleTranslation",
            "example_translation",
            "translation",
            "Translation",
            "dịch ví dụ",
            "example_vi",
          ],
          difficulty: [
            "difficulty",
            "Difficulty",
            "DIFFICULTY",
            "độ khó",
            "level",
            "Level",
          ],
        };

        for (const [standardKey, possibleKeys] of Object.entries(keyMap)) {
          for (const key of possibleKeys) {
            if (row[key] !== undefined && row[key] !== "") {
              normalized[standardKey] = row[key];
              break;
            }
          }
        }

        return normalized;
      });

      return { data: normalizedData, errors };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push(`Failed to parse file: ${message}`);
      return { data: [], errors };
    }
  }

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }
}
