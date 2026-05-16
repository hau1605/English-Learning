import { api, ApiResponse } from '@/services/api';

export interface FlashcardStats {
  totalReviews: number;
  totalCards: number;
  dueCards: number;
  masteredCards: number;
  reviewsByDay: { date: string; count: number }[];
}

export interface DueFlashcard {
  id: string;
  flashcardId: string;
  flashcard: {
    id: string;
    frontContent: string;
    backContent: string;
    audioUrl?: string;
    imageUrl?: string;
  };
  vocabulary: {
    id: string;
    word: string;
    pronunciation?: string;
    meaning: string;
    example?: string;
  };
}

export interface ReviewResponse {
  flashcardId: string;
  isCorrect: boolean;
  xpEarned: number;
  nextReviewAt: string;
  easeFactor: number;
  intervalDays: number;
}

export const flashcardsApi = {
  getDueCards: async (limit?: number): Promise<ApiResponse<DueFlashcard[]>> => {
    const response = await api.get<ApiResponse<DueFlashcard[]>>('/flashcards/due', {
      params: { limit },
    });
    return response.data;
  },

  reviewFlashcard: async (flashcardId: string, rating: number): Promise<ApiResponse<ReviewResponse>> => {
    const response = await api.post<ApiResponse<ReviewResponse>>('/flashcards/review', {
      flashcardId,
      rating,
    });
    return response.data;
  },

  getStats: async (): Promise<ApiResponse<FlashcardStats>> => {
    const response = await api.get<ApiResponse<FlashcardStats>>('/flashcards/stats');
    return response.data;
  },

  getAllFlashcards: async (topicId?: string): Promise<ApiResponse<DueFlashcard[]>> => {
    const response = await api.get<ApiResponse<DueFlashcard[]>>('/flashcards', {
      params: { topicId },
    });
    return response.data;
  },

  resetProgress: async (flashcardId?: string): Promise<ApiResponse<void>> => {
    const response = await api.post<ApiResponse<void>>('/flashcards/reset', { flashcardId });
    return response.data;
  },
};
