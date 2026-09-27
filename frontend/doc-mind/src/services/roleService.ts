import { apiRequest } from './apiClient';
import type { RoleResponse } from '../types/role';

export const roleService = {
  async getRoles(): Promise<RoleResponse[]> {
    return apiRequest<RoleResponse[]>('/api/roles', {
      method: 'GET',
    });
  },
};
