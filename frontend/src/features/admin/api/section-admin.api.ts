import { api, ApiResponse } from '@/services/api';

export interface Section {
  id: string;
  courseId: string;
  course?: { id: string; title: string };
  title: string;
  description?: string;
  orderIndex: number;
  lessons?: Lesson[];
  createdAt: string;
  updatedAt: string;
}

export interface Lesson {
  id: string;
  sectionId: string;
  section?: {
    id: string;
    title: string;
    course?: { id: string; title: string };
  };
  title: string;
  description?: string;
  type: 'VIDEO' | 'READING' | 'INTERACTIVE' | 'PRACTICE' | 'QUIZ';
  content?: string;
  videoUrl?: string;
  estimatedTime?: number;
  orderIndex: number;
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

export interface CreateSectionDto {
  courseId: string;
  title: string;
  description?: string;
  orderIndex?: number;
}

export interface UpdateSectionDto {
  title?: string;
  description?: string;
  orderIndex?: number;
}

export interface CreateLessonDto {
  sectionId: string;
  title: string;
  description?: string;
  type: 'VIDEO' | 'READING' | 'INTERACTIVE' | 'PRACTICE' | 'QUIZ';
  content?: string;
  videoUrl?: string;
  estimatedTime?: number;
  orderIndex?: number;
}

export interface UpdateLessonDto {
  title?: string;
  description?: string;
  type?: 'VIDEO' | 'READING' | 'INTERACTIVE' | 'PRACTICE' | 'QUIZ';
  content?: string;
  videoUrl?: string;
  estimatedTime?: number;
  orderIndex?: number;
}

export interface SectionQueryDto {
  courseId?: string;
  page?: number;
  limit?: number;
}

export interface LessonQueryDto {
  sectionId?: string;
  page?: number;
  limit?: number;
}

export const sectionAdminApi = {
  getSections: async (params?: SectionQueryDto) => {
    const response = await api.get<ApiResponse<Section[]> & { meta: PaginatedData<Section>['meta'] }>('/sections/admin/sections', { params });
    return response.data;
  },

  getSectionsByCourse: async (courseId: string): Promise<ApiResponse<Section[]>> => {
    const response = await api.get<ApiResponse<Section[]>>(`/sections/course/${courseId}`);
    return response.data;
  },

  getSectionById: async (id: string): Promise<ApiResponse<Section>> => {
    const response = await api.get<ApiResponse<Section>>(`/sections/${id}`);
    return response.data;
  },

  createSection: async (data: CreateSectionDto): Promise<ApiResponse<Section>> => {
    const response = await api.post<ApiResponse<Section>>('/sections/admin/sections', data);
    return response.data;
  },

  updateSection: async (id: string, data: UpdateSectionDto): Promise<ApiResponse<Section>> => {
    const response = await api.put<ApiResponse<Section>>(`/sections/admin/sections/${id}`, data);
    return response.data;
  },

  deleteSection: async (id: string): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(`/sections/admin/sections/${id}`);
    return response.data;
  },

  reorderSections: async (courseId: string, sectionIds: string[]): Promise<ApiResponse<void>> => {
    const response = await api.put<ApiResponse<void>>(`/sections/admin/sections/reorder`, {
      courseId,
      sectionIds,
    });
    return response.data;
  },
};

export const lessonAdminApi = {
  getLessons: async (params?: LessonQueryDto): Promise<ApiResponse<PaginatedData<Lesson>>> => {
    const response = await api.get<ApiResponse<PaginatedData<Lesson>>>('/lessons/admin/lessons', { params });
    return response.data;
  },

  getLessonsBySection: async (sectionId: string): Promise<ApiResponse<Lesson[]>> => {
    const response = await api.get<ApiResponse<Lesson[]>>(`/lessons/section/${sectionId}`);
    return response.data;
  },

  getLessonById: async (id: string): Promise<ApiResponse<Lesson>> => {
    const response = await api.get<ApiResponse<Lesson>>(`/lessons/${id}`);
    return response.data;
  },

  createLesson: async (data: CreateLessonDto): Promise<ApiResponse<Lesson>> => {
    const response = await api.post<ApiResponse<Lesson>>('/lessons/admin/lessons', data);
    return response.data;
  },

  updateLesson: async (id: string, data: UpdateLessonDto): Promise<ApiResponse<Lesson>> => {
    const response = await api.put<ApiResponse<Lesson>>(`/lessons/admin/lessons/${id}`, data);
    return response.data;
  },

  deleteLesson: async (id: string): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(`/lessons/admin/lessons/${id}`);
    return response.data;
  },

  reorderLessons: async (sectionId: string, lessonIds: string[]): Promise<ApiResponse<void>> => {
    const response = await api.put<ApiResponse<void>>(`/lessons/admin/lessons/reorder`, {
      sectionId,
      lessonIds,
    });
    return response.data;
  },
};
