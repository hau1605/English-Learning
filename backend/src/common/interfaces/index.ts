export interface JwtPayload {
  sub: string;
  sessionId: string;
  type: 'access' | 'refresh';
  iat?: number;
  exp?: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  cursor?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export interface RequestWithUser extends Request {
  user: {
    id: string;
    sessionId: string;
  };
}

export interface SessionInfo {
  userId: string;
  sessionId: string;
  email: string;
  roles: string[];
  permissions: string[];
  expiresAt: Date;
}
