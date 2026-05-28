import { api, ApiResponse } from '@/services/api';

export type CourseLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
export type CourseStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface Course {
  id: string;
  title: string;
  description?: string;
  thumbnail?: string;
  level: CourseLevel;
  status: CourseStatus;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  sections?: CourseSection[];
  totalLessons?: number;
}

export interface CourseSection {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  orderIndex: number;
  lessons: Lesson[];
}

export interface Lesson {
  id: string;
  sectionId: string;
  title: string;
  description?: string;
  type: 'VIDEO' | 'READING' | 'INTERACTIVE' | 'PRACTICE';
  content?: string;
  videoUrl?: string;
  estimatedTime?: number;
  orderIndex: number;
}

export interface CourseProgress {
  courseId: string;
  totalLessons: number;
  completedLessons: number;
  progress: number;
  nextLesson?: {
    id: string;
    title: string;
  };
  previousLesson?: {
    id: string;
    title: string;
  };
}

export interface CoursesListResponse {
  data: Course[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface GetCoursesParams {
  status?: CourseStatus;
  level?: CourseLevel;
  search?: string;
  page?: number;
  limit?: number;
}

export const coursesApi = {
  getCourses: async (params?: GetCoursesParams): Promise<ApiResponse<CoursesListResponse>> => {
    const response = await api.get<ApiResponse<CoursesListResponse>>('/courses', { params });
    return response.data;
  },

  getPublishedCourses: async (): Promise<ApiResponse<Course[]>> => {
    const response = await api.get<ApiResponse<Course[]>>('/courses/published');
    return response.data;
  },

  getCourse: async (id: string): Promise<ApiResponse<Course>> => {
    const response = await api.get<ApiResponse<Course>>(`/courses/${id}`);
    return response.data;
  },

  getCourseProgress: async (courseId: string): Promise<ApiResponse<CourseProgress>> => {
    const response = await api.get<ApiResponse<CourseProgress>>(`/courses/${courseId}/progress`);
    return response.data;
  },

  getCourseSections: async (courseId: string): Promise<ApiResponse<CourseSection[]>> => {
    const response = await api.get<ApiResponse<CourseSection[]>>(`/courses/${courseId}/sections`);
    return response.data;
  },

  getSectionLessons: async (courseId: string, sectionId: string): Promise<ApiResponse<Lesson[]>> => {
    const response = await api.get<ApiResponse<Lesson[]>>(`/courses/${courseId}/sections/${sectionId}/lessons`);
    return response.data;
  },

  getLesson: async (courseId: string, lessonId: string): Promise<ApiResponse<Lesson>> => {
    const response = await api.get<ApiResponse<Lesson>>(`/lessons/${lessonId}`);
    return response.data;
  },

  markLessonViewed: async (lessonId: string): Promise<ApiResponse<void>> => {
    const response = await api.post<ApiResponse<void>>(`/lessons/${lessonId}/view`);
    return response.data;
  },

  createCourse: async (data: Partial<Course>): Promise<ApiResponse<Course>> => {
    const response = await api.post<ApiResponse<Course>>('/courses', data);
    return response.data;
  },

  updateCourse: async (id: string, data: Partial<Course>): Promise<ApiResponse<Course>> => {
    const response = await api.patch<ApiResponse<Course>>(`/courses/${id}`, data);
    return response.data;
  },

  publishCourse: async (id: string): Promise<ApiResponse<Course>> => {
    const response = await api.patch<ApiResponse<Course>>(`/courses/${id}/publish`);
    return response.data;
  },

  deleteCourse: async (id: string): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(`/courses/${id}`);
    return response.data;
  },

  createSection: async (courseId: string, data: { title: string; description?: string }): Promise<ApiResponse<CourseSection>> => {
    const response = await api.post<ApiResponse<CourseSection>>(`/courses/${courseId}/sections`, data);
    return response.data;
  },

  updateSection: async (courseId: string, sectionId: string, data: { title?: string; description?: string }): Promise<ApiResponse<CourseSection>> => {
    const response = await api.patch<ApiResponse<CourseSection>>(`/courses/${courseId}/sections/${sectionId}`, data);
    return response.data;
  },

  deleteSection: async (courseId: string, sectionId: string): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(`/courses/${courseId}/sections/${sectionId}`);
    return response.data;
  },

  createLesson: async (sectionId: string, data: Partial<Lesson>): Promise<ApiResponse<Lesson>> => {
    const response = await api.post<ApiResponse<Lesson>>(`/sections/${sectionId}/lessons`, data);
    return response.data;
  },

  updateLesson: async (lessonId: string, data: Partial<Lesson>): Promise<ApiResponse<Lesson>> => {
    const response = await api.patch<ApiResponse<Lesson>>(`/lessons/${lessonId}`, data);
    return response.data;
  },

  deleteLesson: async (lessonId: string): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(`/lessons/${lessonId}`);
    return response.data;
  },
};
