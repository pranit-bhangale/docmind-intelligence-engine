import { apiRequest } from './apiClient';
import type { LoginRequest, LoginResponse, UserResponse } from '../types/auth';

export const authService = {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    return apiRequest<LoginResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  async logout(): Promise<string> {
    return apiRequest<string>('/api/auth/logout', {
      method: 'POST',
    });
  },

  async refreshToken(): Promise<void> {
    return apiRequest<void>('/api/auth/refresh', {
      method: 'POST',
    });
  },

  async getMe(): Promise<UserResponse> {
    return apiRequest<UserResponse>('/api/auth/me', {
      method: 'GET',
    });
  },
};
