import { api, ApiResponse } from '@/services/api';

export interface Quiz {
  id: string;
  title: string;
  description?: string;
  type: string;
  passingScore: number;
  durationSeconds?: number;
  questions: QuizQuestion[];
  _count?: { questions: number };
}

export interface QuizQuestion {
  id: string;
  question: string;
  type: string;
  explanation?: string;
  answers: QuizAnswer[];
}

export interface QuizAnswer {
  id: string;
  answer: string;
}

export interface QuizResult {
  attemptId: string;
  score: number;
  totalCorrect: number;
  totalQuestions: number;
  passed: boolean;
  questionResults: {
    questionId: string;
    correct: boolean;
    correctAnswerIds: string[];
  }[];
}

export const quizzesApi = {
  getQuizzes: async (params?: { lessonId?: string; type?: string }): Promise<ApiResponse<Quiz[]>> => {
    const response = await api.get<ApiResponse<Quiz[]>>('/quizzes', { params });
    return response.data;
  },

  getQuizById: async (id: string): Promise<ApiResponse<Quiz>> => {
    const response = await api.get<ApiResponse<Quiz>>(`/quizzes/${id}`);
    return response.data;
  },

  submitQuiz: async (
    quizId: string,
    answers: { questionId: string; answerIds: string[] }[]
  ): Promise<ApiResponse<QuizResult>> => {
    const response = await api.post<ApiResponse<QuizResult>>(`/quizzes/${quizId}/submit`, {
      answers,
    });
    return response.data;
  },

  getHistory: async (params?: { page?: number; limit?: number }): Promise<ApiResponse<any>> => {
    const response = await api.get<ApiResponse<any>>('/quizzes/history', { params });
    return response.data;
  },
};
