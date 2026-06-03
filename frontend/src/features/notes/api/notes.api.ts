import { api, ApiResponse } from '@/services/api';

export type NoteType =
  | 'VOCABULARY'
  | 'GRAMMAR'
  | 'PHRASE'
  | 'LESSON'
  | 'QUIZ_MISTAKE'
  | 'SPEAKING_FEEDBACK'
  | 'CUSTOM';

export type NoteSourceType =
  | 'VOCABULARY'
  | 'GRAMMAR_LESSON'
  | 'LESSON'
  | 'QUIZ'
  | 'QUIZ_QUESTION'
  | 'SPEAKING_ATTEMPT';

export interface UserNote {
  id: string;
  userId: string;
  type: NoteType;
  title: string;
  content: string;
  sourceType?: NoteSourceType;
  sourceId?: string;
  tags: string[];
  color?: string;
  isPinned: boolean;
  isArchived: boolean;
  reviewAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotesQuery {
  page?: number;
  limit?: number;
  q?: string;
  type?: NoteType;
  tag?: string;
  sourceType?: NoteSourceType;
  sourceId?: string;
  isPinned?: boolean;
  isArchived?: boolean;
}

export interface SaveNotePayload {
  title: string;
  content: string;
  type?: NoteType;
  sourceType?: NoteSourceType;
  sourceId?: string;
  tags?: string[];
  color?: string;
  isPinned?: boolean;
  isArchived?: boolean;
  reviewAt?: string;
}

export interface NotesResponse {
  data: UserNote[];
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasMore?: boolean;
  };
}

export const notesApi = {
  getNotes: async (params?: NotesQuery): Promise<ApiResponse<UserNote[]>> => {
    const response = await api.get<ApiResponse<UserNote[]>>('/notes', { params });
    return response.data;
  },

  getTags: async (): Promise<ApiResponse<string[]>> => {
    const response = await api.get<ApiResponse<string[]>>('/notes/tags');
    return response.data;
  },

  createNote: async (payload: SaveNotePayload): Promise<ApiResponse<UserNote>> => {
    const response = await api.post<ApiResponse<UserNote>>('/notes', payload);
    return response.data;
  },

  updateNote: async ({
    id,
    ...payload
  }: SaveNotePayload & { id: string }): Promise<ApiResponse<UserNote>> => {
    const response = await api.patch<ApiResponse<UserNote>>(`/notes/${id}`, payload);
    return response.data;
  },

  deleteNote: async (id: string): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(`/notes/${id}`);
    return response.data;
  },

  bulkDelete: async (ids: string[]): Promise<ApiResponse<{ count: number }>> => {
    const response = await api.post<ApiResponse<{ count: number }>>('/notes/bulk-delete', { ids });
    return response.data;
  },

  createFlashcard: async (id: string): Promise<ApiResponse<unknown>> => {
    const response = await api.post<ApiResponse<unknown>>(`/notes/${id}/create-flashcard`);
    return response.data;
  },
};
