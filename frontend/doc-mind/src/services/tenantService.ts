import { apiRequest } from './apiClient';
import type { PageResponse } from '../types/api';
import type { TenantRegisterRequest, TenantResponse } from '../types/tenant';

export interface GetTenantsParams {
  page?: number;
  size?: number;
  keyword?: string;
  sortBy?: string;
  sortDirection?: 'ASC' | 'DESC';
}

export const tenantService = {
  async getTenants(params?: GetTenantsParams): Promise<PageResponse<TenantResponse>> {
    const requestedSize = params?.size ?? 10;
    const clampedSize = Math.min(Math.max(requestedSize, 1), 10);

    return apiRequest<PageResponse<TenantResponse>>('/api/tenants', {
      method: 'GET',
      params: {
        page: params?.page ?? 0,
        size: clampedSize,
        keyword: params?.keyword,
        sortBy: params?.sortBy ?? 'companyName',
        sortDirection: params?.sortDirection ?? 'ASC',
      },
    });
  },

  async registerTenant(data: TenantRegisterRequest): Promise<void> {
    return apiRequest<void>('/api/tenants/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async approveTenant(tenantId: string): Promise<void> {
    return apiRequest<void>(`/api/tenants/approve/${encodeURIComponent(tenantId)}`, {
      method: 'POST',
    });
  },

  async activateTenant(tenantId: string): Promise<void> {
    return apiRequest<void>(`/api/tenants/activate/${encodeURIComponent(tenantId)}`, {
      method: 'PATCH',
    });
  },

  async deactivateTenant(tenantId: string): Promise<void> {
    return apiRequest<void>(`/api/tenants/deactivate/${encodeURIComponent(tenantId)}`, {
      method: 'PATCH',
    });
  },

  async suspendTenant(tenantId: string): Promise<void> {
    return apiRequest<void>(`/api/tenants/suspend/${encodeURIComponent(tenantId)}`, {
      method: 'PATCH',
    });
  },

  async getCurrentTenant(): Promise<TenantResponse> {
    return apiRequest<TenantResponse>('/api/tenants/me', {
      method: 'GET',
    });
  },
};
