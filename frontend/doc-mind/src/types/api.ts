export interface PageResponse<T> {
  contents: T[];
  currentPage: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  isLastPage: boolean;
  isFirstPage: boolean;
}

export interface ApiErrorResponse {
  message?: string;
  status?: number;
  timestamp?: string;
  errors?: Record<string, string>;
}
