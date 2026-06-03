import { api, ApiResponse } from '@/services/api';

export type ExamDifficulty = 'EASY' | 'MEDIUM' | 'HARD' | 'VERY_HARD';
export type ExamPracticeSetType = 'PRACTICE_SET' | 'MINI_TEST' | 'FULL_TEST';
export type ExamAttemptStatus = 'IN_PROGRESS' | 'SUBMITTED' | 'EXPIRED';

export interface ExamSection {
  id: string;
  code: string;
  name: string;
  skill: string;
  partNumber?: number;
  description?: string;
  durationMinutes?: number;
  questionCount?: number;
  orderIndex: number;
}

export interface Exam {
  id: string;
  code: string;
  name: string;
  description?: string;
  totalDurationMinutes?: number;
  sections: ExamSection[];
}

export interface PracticeSet {
  id: string;
  examId: string;
  sectionId?: string;
  title: string;
  description?: string;
  type: ExamPracticeSetType;
  recommendedMinutes?: number;
  difficulty: ExamDifficulty;
  topic?: string;
  showExplanationImmediately: boolean;
  allowRetake: boolean;
  exam?: Pick<Exam, 'id' | 'code' | 'name'>;
  section?: Pick<ExamSection, 'id' | 'code' | 'name' | 'partNumber'>;
  _count?: {
    questions: number;
    attempts: number;
  };
}

export interface PracticeAnswer {
  id: string;
  attemptId: string;
  questionId: string;
  selectedOptionIds: string[];
  textAnswer?: string;
  isCorrect?: boolean;
  pointsEarned: number;
  markedForReview: boolean;
  questionSnapshot: {
    id: string;
    code: string;
    type: string;
    prompt: string;
    passage?: {
      id: string;
      title: string;
      content: string;
    } | null;
    difficulty?: string;
    topic?: string;
    skillTag?: string;
    knowledgeTags?: string[];
  };
  optionSnapshot: Array<{
    id: string;
    content: string;
    orderIndex: number;
  }>;
  correctAnswerSnapshot: {
    selectedOptionIds: string[];
  };
  explanationSnapshot?: string;
}

export interface PracticeAttempt {
  id: string;
  userId: string;
  practiceSetId: string;
  mode: string;
  status: ExamAttemptStatus;
  startedAt: string;
  submittedAt?: string;
  expiresAt?: string;
  scorePercent?: number;
  totalCorrect: number;
  totalQuestions: number;
  timeSpentSeconds?: number;
  analysis?: {
    weakTags?: Array<{ tag: string; count: number }>;
  };
  practiceSet: PracticeSet & {
    questions?: Array<{ questionId: string; points: number; orderIndex: number }>;
  };
  answers: PracticeAnswer[];
}

export interface PracticeSetsQuery {
  examId?: string;
  sectionId?: string;
  type?: ExamPracticeSetType;
  difficulty?: ExamDifficulty;
  topic?: string;
  page?: number;
  limit?: number;
}

export const examPracticeApi = {
  getExams: async (): Promise<ApiResponse<Exam[]>> => {
    const response = await api.get<ApiResponse<Exam[]>>('/exam-practice/exams');
    return response.data;
  },

  getPracticeSets: async (
    params?: PracticeSetsQuery,
  ): Promise<ApiResponse<PracticeSet[]>> => {
    const response = await api.get<ApiResponse<PracticeSet[]>>(
      '/exam-practice/practice-sets',
      { params },
    );
    return response.data;
  },

  startAttempt: async (practiceSetId: string): Promise<ApiResponse<PracticeAttempt>> => {
    const response = await api.post<ApiResponse<PracticeAttempt>>(
      `/exam-practice/practice-sets/${practiceSetId}/start`,
      { mode: 'PRACTICE' },
    );
    return response.data;
  },

  saveAnswers: async (
    attemptId: string,
    answers: Array<{
      questionId: string;
      selectedOptionIds?: string[];
      textAnswer?: string;
      markedForReview?: boolean;
    }>,
  ): Promise<ApiResponse<PracticeAttempt>> => {
    const response = await api.patch<ApiResponse<PracticeAttempt>>(
      `/exam-practice/attempts/${attemptId}/answers`,
      { answers },
    );
    return response.data;
  },

  submitAttempt: async (attemptId: string): Promise<ApiResponse<PracticeAttempt>> => {
    const response = await api.post<ApiResponse<PracticeAttempt>>(
      `/exam-practice/attempts/${attemptId}/submit`,
    );
    return response.data;
  },

  getHistory: async (): Promise<ApiResponse<PracticeAttempt[]>> => {
    const response = await api.get<ApiResponse<PracticeAttempt[]>>(
      '/exam-practice/history',
    );
    return response.data;
  },

  getWrongQuestions: async (): Promise<ApiResponse<PracticeAnswer[]>> => {
    const response = await api.get<ApiResponse<PracticeAnswer[]>>(
      '/exam-practice/wrong-questions',
    );
    return response.data;
  },

  reportQuestion: async (
    questionId: string,
    payload: { reason: string; message?: string },
  ): Promise<ApiResponse<unknown>> => {
    const response = await api.post<ApiResponse<unknown>>(
      `/exam-practice/questions/${questionId}/report`,
      payload,
    );
    return response.data;
  },
};
