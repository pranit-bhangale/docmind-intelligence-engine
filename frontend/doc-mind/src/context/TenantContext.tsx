import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { tenantService } from '../services/tenantService';
import { useAuth } from './AuthContext';
import type { TenantResponse } from '../types/tenant';

interface TenantContextType {
  activeTenant: TenantResponse | null;
  tenants: TenantResponse[];
  isLoadingTenants: boolean;
  error: string | null;
  setActiveTenant: (tenant: TenantResponse | null) => void;
  refreshTenants: () => Promise<void>;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, canAccessTenants } = useAuth();
  const [tenants, setTenants] = useState<TenantResponse[]>([]);
  const [activeTenant, setActiveTenantState] = useState<TenantResponse | null>(null);
  const [isLoadingTenants, setIsLoadingTenants] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const refreshTenants = useCallback(async () => {
    if (!isAuthenticated) {
      setTenants([]);
      setActiveTenantState(null);
      return;
    }
    setIsLoadingTenants(true);
    setError(null);
    try {
      if (canAccessTenants) {
        const response = await tenantService.getTenants({ page: 0, size: 10 });
        if (response && response.contents) {
          setTenants(response.contents);
          const savedTenantId = localStorage.getItem('docmind_active_tenant_id');
          const found = response.contents.find((t) => t.tenantId === savedTenantId);
          setActiveTenantState(found || response.contents[0] || null);
        } else {
          setTenants([]);
          setActiveTenantState(null);
        }
      } else {
        setTenants([]);
        try {
          const currentTenant = await tenantService.getCurrentTenant();
          setActiveTenantState(currentTenant || null);
        } catch {
          setActiveTenantState(null);
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch tenants';
      setError(message);
      setTenants([]);
      setActiveTenantState(null);
    } finally {
      setIsLoadingTenants(false);
    }
  }, [isAuthenticated, canAccessTenants]);

  useEffect(() => {
    if (isAuthenticated) {
      refreshTenants();
    } else {
      setTenants([]);
      setActiveTenantState(null);
    }
  }, [isAuthenticated, refreshTenants]);

  const setActiveTenant = (tenant: TenantResponse | null) => {
    setActiveTenantState(tenant);
    if (tenant) {
      localStorage.setItem('docmind_active_tenant_id', tenant.tenantId);
    } else {
      localStorage.removeItem('docmind_active_tenant_id');
    }
  };

  return (
    <TenantContext.Provider
      value={{
        activeTenant,
        tenants,
        isLoadingTenants,
        error,
        setActiveTenant,
        refreshTenants,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = (): TenantContextType => {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
};
