import { apiRequest } from './apiClient';
import type { PageResponse } from '../types/api';

export interface DocumentResponse {
  id: string;
  fileName: string;
  fileExtension: string;
  fileSizeFormatted: string;
  chunkCount: number;
  status: string;
  uploadedAt: string;
  contentPreview?: string;
}

export interface GetDocumentsParams {
  page?: number;
  size?: number;
  keyword?: string;
  sortBy?: string;
  sortDirection?: 'ASC' | 'DESC';
}

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export const documentService = {
  async uploadDocument(file: File): Promise<DocumentResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${BASE_URL}/api/documents/upload`, {
      method: 'POST',
      headers: {
        'X-API-Version': 'v1',
      },
      credentials: 'include',
      body: formData,
    });

    if (!response.ok) {
      let errorMessage = `Upload failed with status ${response.status}`;
      try {
        const errJson = await response.json();
        errorMessage = errJson.message || errorMessage;
      } catch {
        // ignore
      }
      throw new Error(errorMessage);
    }

    const resData = await response.json();
    return resData.data || resData;
  },

  async getDocumentById(documentId: string, conversationId?: string): Promise<DocumentResponse> {
    const headers: Record<string, string> = {};
    if (conversationId) {
      headers['X-Conversation-Id'] = conversationId;
    }
    return apiRequest<DocumentResponse>(`/api/documents/${encodeURIComponent(documentId)}`, {
      method: 'GET',
      headers,
    });
  },

  async deleteDocument(documentId: string): Promise<void> {
    return apiRequest<void>(`/api/documents/${encodeURIComponent(documentId)}/delete`, {
      method: 'DELETE',
    });
  },

  async getDocuments(params?: GetDocumentsParams): Promise<PageResponse<DocumentResponse>> {
    const requestedSize = params?.size ?? 5;
    const clampedSize = Math.min(Math.max(requestedSize, 1), 5);

    return apiRequest<PageResponse<DocumentResponse>>('/api/documents', {
      method: 'GET',
      params: {
        page: params?.page ?? 0,
        size: clampedSize,
        keyword: params?.keyword,
        sortBy: params?.sortBy ?? 'fileName',
        sortDirection: params?.sortDirection ?? 'ASC',
      },
    });
  },
};
