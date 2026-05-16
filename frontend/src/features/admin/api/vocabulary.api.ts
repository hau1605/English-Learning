import { api, ApiResponse } from '@/services/api';

export interface Topic {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  _count?: { vocabularies: number };
  createdAt: string;
  updatedAt: string;
}

export interface Vocabulary {
  id: string;
  topicId: string;
  word: string;
  pronunciation?: string;
  meaning: string;
  example?: string;
  exampleTranslation?: string;
  audioUrl?: string;
  imageUrl?: string;
  difficulty: number;
  partOfSpeech?: string;
  topic?: { id: string; name: string; slug: string };
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

export interface CreateTopicDto {
  name: string;
  slug: string;
  description?: string;
  icon?: string;
}

export interface UpdateTopicDto {
  name?: string;
  description?: string;
  icon?: string;
}

export interface CreateVocabularyDto {
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
}

export interface UpdateVocabularyDto {
  word?: string;
  pronunciation?: string;
  meaning?: string;
  example?: string;
  exampleTranslation?: string;
  audioUrl?: string;
  imageUrl?: string;
  difficulty?: number;
  partOfSpeech?: string;
}

export interface VocabularyQueryDto {
  search?: string;
  page?: number;
  limit?: number;
  difficulty?: number;
}

export type ExportFormat = 'csv' | 'xlsx' | 'json';

export interface ExportQueryDto {
  topicId?: string;
  format?: ExportFormat;
  difficulty?: number;
}

export interface ImportVocabularyDto {
  topicId: string;
  defaultDifficulty?: number;
  createTopicIfNotExists?: string;
}

export const vocabularyApi = {
  // Public endpoints
  getTopics: async (): Promise<ApiResponse<Topic[]>> => {
    const response = await api.get<ApiResponse<Topic[]>>('/vocabulary/topics');
    return response.data;
  },

  getTopicBySlug: async (slug: string): Promise<ApiResponse<Topic & { vocabularies: Vocabulary[] }>> => {
    const response = await api.get<ApiResponse<Topic & { vocabularies: Vocabulary[] }>>(`/vocabulary/topics/${slug}`);
    return response.data;
  },

  getVocabulariesByTopic: async (topicId: string): Promise<ApiResponse<Vocabulary[]>> => {
    const response = await api.get<ApiResponse<Vocabulary[]>>(`/vocabulary/topics/${topicId}/vocabularies`);
    return response.data;
  },

  search: async (query: string, limit?: number): Promise<ApiResponse<Vocabulary[]>> => {
    const response = await api.get<ApiResponse<Vocabulary[]>>('/vocabulary/search', {
      params: { q: query, limit },
    });
    return response.data;
  },

  getById: async (id: string): Promise<ApiResponse<Vocabulary>> => {
    const response = await api.get<ApiResponse<Vocabulary>>(`/vocabulary/${id}`);
    return response.data;
  },

  // Admin endpoints
  getTopicsAdmin: async (): Promise<ApiResponse<Topic[]>> => {
    const response = await api.get<ApiResponse<Topic[]>>('/vocabulary/admin/topics');
    return response.data;
  },

  createTopic: async (data: CreateTopicDto): Promise<ApiResponse<Topic>> => {
    const response = await api.post<ApiResponse<Topic>>('/vocabulary/admin/topics', data);
    return response.data;
  },

  updateTopic: async (id: string, data: UpdateTopicDto): Promise<ApiResponse<Topic>> => {
    const response = await api.put<ApiResponse<Topic>>(`/vocabulary/admin/topics/${id}`, data);
    return response.data;
  },

  deleteTopic: async (id: string): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(`/vocabulary/admin/topics/${id}`);
    return response.data;
  },

  getVocabulariesAdmin: async (params?: VocabularyQueryDto) => {
    const response = await api.get<ApiResponse<Vocabulary[]> & { meta: PaginatedData<Vocabulary>['meta'] }>('/vocabulary/admin/vocabularies', {
      params,
    });
    console.log("[VOCABULARY API] getVocabulariesAdmin", response.data);
    return response.data;
  },

  createVocabulary: async (data: CreateVocabularyDto): Promise<ApiResponse<Vocabulary>> => {
    const response = await api.post<ApiResponse<Vocabulary>>('/vocabulary/admin/vocabularies', data);
    return response.data;
  },

  updateVocabulary: async (id: string, data: UpdateVocabularyDto): Promise<ApiResponse<Vocabulary>> => {
    const response = await api.put<ApiResponse<Vocabulary>>(`/vocabulary/admin/vocabularies/${id}`, data);
    return response.data;
  },

  deleteVocabulary: async (id: string): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(`/vocabulary/admin/vocabularies/${id}`);
    return response.data;
  },

  createBulkVocabulary: async (data: CreateVocabularyDto[]): Promise<ApiResponse<Vocabulary[]>> => {
    const response = await api.post<ApiResponse<Vocabulary[]>>('/vocabulary/admin/vocabularies/bulk', data);
    return response.data;
  },

  // Import / Export
  exportVocabulary: async (params: ExportQueryDto): Promise<Blob> => {
    const response = await api.get('/vocabulary/admin/export', {
      params,
      responseType: 'blob',
    });
    return response.data;
  },

  importVocabulary: async (file: File, params: ImportVocabularyDto) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('topicId', params.topicId);
    if (params.defaultDifficulty) {
      formData.append('defaultDifficulty', params.defaultDifficulty.toString());
    }
    if (params.createTopicIfNotExists) {
      formData.append('createTopicIfNotExists', params.createTopicIfNotExists);
    }

    const response = await api.post('/vocabulary/admin/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response;
  },
};
