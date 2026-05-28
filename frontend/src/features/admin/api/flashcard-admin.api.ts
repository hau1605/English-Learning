import { api, ApiResponse } from '@/services/api';

export interface Flashcard {
  id: string;
  vocabularyId: string;
  frontContent: string;
  backContent: string;
  audioUrl?: string;
  imageUrl?: string;
  hint?: string;
  vocabulary?: {
    id: string;
    word: string;
    meaning: string;
    pronunciation?: string;
    topic?: { id: string; name: string };
  };
  _count?: { reviews: number };
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedData<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CreateFlashcardDto {
  vocabularyId: string;
  frontContent: string;
  backContent: string;
  audioUrl?: string;
  imageUrl?: string;
  hint?: string;
}

export interface UpdateFlashcardDto {
  frontContent?: string;
  backContent?: string;
  audioUrl?: string;
  imageUrl?: string;
  hint?: string;
}

export interface FlashcardQueryDto {
  search?: string;
  topicId?: string;
  page?: number;
  limit?: number;
  difficulty?: number;
}

export const flashcardAdminApi = {
  getFlashcards: async (params?: FlashcardQueryDto) => {
    const response = await api.get<ApiResponse<Flashcard[]> & { meta: PaginatedData<Flashcard>['meta'] }>('/flashcards/admin/flashcards', { params });
    console.log("[FLASHCARD API] getFlashcards", response.data);
    return response.data;
  },

  getFlashcardById: async (id: string): Promise<ApiResponse<Flashcard>> => {
    const response = await api.get<ApiResponse<Flashcard>>(`/flashcards/admin/flashcards/${id}`);
    return response.data;
  },

  createFlashcard: async (data: CreateFlashcardDto): Promise<ApiResponse<Flashcard>> => {
    const response = await api.post<ApiResponse<Flashcard>>('/flashcards/admin/flashcards', data);
    return response.data;
  },

  createBulkFlashcards: async (data: CreateFlashcardDto[]): Promise<ApiResponse<{ count: number }>> => {
    const response = await api.post<ApiResponse<{ count: number }>>('/flashcards/admin/flashcards/bulk', data);
    return response.data;
  },

  updateFlashcard: async (id: string, data: UpdateFlashcardDto): Promise<ApiResponse<Flashcard>> => {
    const response = await api.put<ApiResponse<Flashcard>>(`/flashcards/admin/flashcards/${id}`, data);
    return response.data;
  },

  deleteFlashcard: async (id: string): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(`/flashcards/admin/flashcards/${id}`);
    return response.data;
  },

  generateFromVocabulary: async (vocabularyId: string): Promise<ApiResponse<Flashcard>> => {
    const response = await api.post<ApiResponse<Flashcard>>(`/flashcards/admin/vocabularies/${vocabularyId}/generate-flashcard`);
    return response.data;
  },
};
