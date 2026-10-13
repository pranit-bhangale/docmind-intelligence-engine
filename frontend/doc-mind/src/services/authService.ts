import { apiRequest } from './apiClient';
import type {
  ChangeForgotPasswordRequest,
  ForgotPasswordEmail,
  LoginRequest,
  LoginResponse,
  PasswordResponse,
  UserResponse,
  VerificationResponse,
  VerifyOtpRequest,
} from '../types/auth';

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

  async requestPasswordReset(payload: ForgotPasswordEmail): Promise<PasswordResponse> {
    return apiRequest<PasswordResponse>('/api/auth/password/request-reset', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async verifyPasswordResetOtp(payload: VerifyOtpRequest): Promise<VerificationResponse> {
    return apiRequest<VerificationResponse>('/api/auth/verify/password-reset', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async resetPassword(payload: ChangeForgotPasswordRequest): Promise<PasswordResponse> {
    return apiRequest<PasswordResponse>('/api/auth/password/reset', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};
