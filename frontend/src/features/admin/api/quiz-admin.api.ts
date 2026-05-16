import { api, ApiResponse } from '@/services/api';
import { QuizType, QuestionType } from '@/shared/enums';

export interface Quiz {
  id: string;
  lessonId?: string;
  title: string;
  description?: string;
  type: QuizType;
  durationSeconds?: number;
  passingScore: number;
  maxAttempts?: number;
  isGenerated: boolean;
  publishedAt?: string;
  lesson?: { id: string; title: string };
  _count?: { questions: number; attempts: number };
  questions?: QuizQuestion[];
  createdAt: string;
  updatedAt: string;
}

export interface QuizQuestion {
  id: string;
  quizId: string;
  type: QuestionType;
  question: string;
  explanation?: string;
  audioUrl?: string;
  imageUrl?: string;
  orderIndex: number;
  points: number;
  answers: QuizAnswer[];
}

export interface QuizAnswer {
  id: string;
  questionId: string;
  answer: string;
  isCorrect: boolean;
  orderIndex: number;
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

export interface CreateQuizDto {
  lessonId?: string;
  title: string;
  description?: string;
  type: QuizType;
  durationSeconds?: number;
  passingScore?: number;
  maxAttempts?: number;
  isGenerated?: boolean;
  questions?: CreateQuestionDto[];
}

export interface UpdateQuizDto {
  lessonId?: string;
  title?: string;
  description?: string;
  type?: QuizType;
  durationSeconds?: number;
  passingScore?: number;
  maxAttempts?: number;
  publishedAt?: boolean;
}

export interface CreateQuestionDto {
  type: QuestionType;
  question: string;
  explanation?: string;
  audioUrl?: string;
  imageUrl?: string;
  orderIndex?: number;
  points?: number;
  answers: CreateAnswerDto[];
}

export interface CreateAnswerDto {
  answer: string;
  isCorrect: boolean;
  orderIndex?: number;
}

export interface QuizQueryDto {
  search?: string;
  type?: QuizType;
  lessonId?: string;
  page?: number;
  limit?: number;
  published?: boolean;
}

export const quizAdminApi = {
  getQuizzes: async (params?: QuizQueryDto) => {
    const response = await api.get<ApiResponse<Quiz[]> & { meta: PaginatedData<Quiz>['meta'] }>('/quizzes/admin/quizzes', { params });
    return response.data;
  },

  getQuizById: async (id: string): Promise<ApiResponse<Quiz>> => {
    const response = await api.get<ApiResponse<Quiz>>(`/quizzes/${id}`);
    return response.data;
  },

  createQuiz: async (data: CreateQuizDto): Promise<ApiResponse<Quiz>> => {
    const response = await api.post<ApiResponse<Quiz>>('/quizzes/admin/quizzes', data);
    return response.data;
  },

  updateQuiz: async (id: string, data: UpdateQuizDto): Promise<ApiResponse<Quiz>> => {
    const response = await api.put<ApiResponse<Quiz>>(`/quizzes/admin/quizzes/${id}`, data);
    return response.data;
  },

  deleteQuiz: async (id: string): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(`/quizzes/admin/quizzes/${id}`);
    return response.data;
  },

  addQuestion: async (quizId: string, data: CreateQuestionDto): Promise<ApiResponse<QuizQuestion>> => {
    const response = await api.post<ApiResponse<QuizQuestion>>(`/quizzes/admin/quizzes/${quizId}/questions`, data);
    return response.data;
  },

  updateQuestion: async (questionId: string, data: Partial<CreateQuestionDto>): Promise<ApiResponse<QuizQuestion>> => {
    const response = await api.put<ApiResponse<QuizQuestion>>(`/quizzes/admin/quizzes/0/questions/${questionId}`, data);
    return response.data;
  },

  deleteQuestion: async (questionId: string): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(`/quizzes/admin/quizzes/0/questions/${questionId}`);
    return response.data;
  },
};
