import { apiRequest } from './apiClient';
import type { PageResponse } from '../types/api';
import type { UserResponse } from '../types/auth';
import type { RegistrationRequest, UpdatePasswordRequest, UpdateUserRequest } from '../types/user';

export interface GetUsersParams {
  page?: number;
  size?: number;
  keyword?: string;
  sortBy?: string;
  sortDirection?: 'ASC' | 'DESC';
  tenantId?: string;
}

export const userService = {
  async getUsers(params?: GetUsersParams): Promise<PageResponse<UserResponse>> {
    const requestedSize = params?.size ?? 10;
    const clampedSize = Math.min(Math.max(requestedSize, 1), 10);

    return apiRequest<PageResponse<UserResponse>>('/api/user/all', {
      method: 'GET',
      tenantId: params?.tenantId,
      params: {
        page: params?.page ?? 0,
        size: clampedSize,
        keyword: params?.keyword,
        sortBy: params?.sortBy ?? 'username',
        sortDirection: params?.sortDirection ?? 'ASC',
      },
    });
  },

  async registerUser(data: RegistrationRequest): Promise<void> {
    return apiRequest<void>('/api/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateProfile(data: UpdateUserRequest): Promise<void> {
    return apiRequest<void>('/api/user/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async updatePassword(data: UpdatePasswordRequest): Promise<void> {
    return apiRequest<void>('/api/user/password', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async deleteProfile(): Promise<void> {
    return apiRequest<void>('/api/user/profile', {
      method: 'DELETE',
    });
  },
};
