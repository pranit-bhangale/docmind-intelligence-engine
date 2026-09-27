import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Plus,
  CheckCircle2,
  AlertOctagon,
  PauseCircle,
  PlayCircle,
  RefreshCw,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Lock,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/button';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { tenantService } from '../../services/tenantService';
import { useTenant } from '../../context/TenantContext';
import { useAuth } from '../../context/AuthContext';
import type { TenantResponse } from '../../types/tenant';
import type { PageResponse } from '../../types/api';

interface TenantManagementViewProps {
  onOpenRegisterModal: () => void;
}

export const TenantManagementView: React.FC<TenantManagementViewProps> = ({
  onOpenRegisterModal,
}) => {
  const { isAuthenticated, canAccessTenants } = useAuth();
  const { refreshTenants: refreshGlobalTenants } = useTenant();
  const [data, setData] = useState<PageResponse<TenantResponse> | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Pagination
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  const fetchTenants = useCallback(async () => {
    if (!isAuthenticated || !canAccessTenants) return;
    setLoading(true);
    setError(null);
    try {
      const res = await tenantService.getTenants({
        page,
        size,
        keyword: keyword || undefined,
        sortBy: 'companyName',
        sortDirection: 'ASC',
      });
      setData(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tenants');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, canAccessTenants, page, size, keyword]);

  useEffect(() => {
    if (isAuthenticated && canAccessTenants) {
      fetchTenants();
    }
  }, [isAuthenticated, canAccessTenants, fetchTenants]);

  if (!canAccessTenants) {
    return (
      <div className="space-y-6">
        <div className="border-b border-border pb-4">
          <h1 className="text-xl font-bold tracking-tight text-foreground">Multi-Tenant Management</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Platform Tenant Provisioning</p>
        </div>
        <Card className="p-8 text-center space-y-3">
          <div className="inline-flex size-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 mx-auto">
            <Lock className="size-6" />
          </div>
          <h2 className="text-base font-bold text-foreground">Access Restricted</h2>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            Platform Admin authority (<code className="font-sans font-medium text-foreground">ROLE_PLATFORM_ADMIN</code>) is required to view and manage tenant organization partitions.
          </p>
        </Card>
      </div>
    );
  }

  const handleAction = async (tenantId: string, actionType: 'approve' | 'activate' | 'deactivate' | 'suspend') => {
    setActionInProgress(tenantId);
    try {
      if (actionType === 'approve') await tenantService.approveTenant(tenantId);
      else if (actionType === 'activate') await tenantService.activateTenant(tenantId);
      else if (actionType === 'deactivate') await tenantService.deactivateTenant(tenantId);
      else if (actionType === 'suspend') await tenantService.suspendTenant(tenantId);

      await fetchTenants();
      await refreshGlobalTenants();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : `Action failed`);
    } finally {
      setActionInProgress(null);
    }
  };

  const filteredContents = (data?.contents || []).filter((t) => {
    if (statusFilter === 'ALL') return true;
    return t.status === statusFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border pb-4 gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Multi-Tenant Management
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Approve, activate, deactivate, or suspend isolated tenant organizations
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchTenants} disabled={loading} className="gap-1.5">
            <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={onOpenRegisterModal} className="gap-1.5">
            <Plus className="size-3.5" />
            Register Tenant
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <Card>
        <CardContent className="p-4 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative w-full md:w-80">
            <Input
              placeholder="Filter by company name or code..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              icon={<Search className="size-3.5" />}
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            <SlidersHorizontal className="size-3.5 text-muted-foreground shrink-0" />
            {['ALL', 'ACTIVE', 'PENDING', 'APPROVED', 'SUSPENDED', 'INACTIVE'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  statusFilter === st
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'bg-muted/40 text-muted-foreground hover:bg-accent hover:text-foreground'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Table Card */}
      <Card>
        <CardHeader className="pb-3 border-b border-border">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold">Tenant Directory</CardTitle>
            <span className="text-xs text-muted-foreground font-medium">
              Total: {data?.totalElements || filteredContents.length} records
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {error && (
            <div className="p-4 m-4 rounded-lg border border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs flex items-center gap-2">
              <ShieldAlert className="size-4" />
              <span>Backend notice: {error}</span>
            </div>
          )}

          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Company Name</th>
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Admin Email</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Created At</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredContents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted-foreground">
                    No tenants found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredContents.map((tenant) => {
                  const isBusy = actionInProgress === tenant.tenantId;

                  return (
                    <tr key={tenant.tenantId} className="hover:bg-muted/20 transition-colors">
                      <td className="py-3 px-4 font-semibold text-foreground">
                        <div className="flex items-center gap-2">
                          <div className="flex size-7 items-center justify-center rounded-md bg-primary/10 text-primary font-bold text-xs">
                            {tenant.companyName.charAt(0)}
                          </div>
                          <div>
                            <div>{tenant.companyName}</div>
                            <div className="text-[10px] text-muted-foreground">{tenant.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-semibold text-foreground">{tenant.companyCode}</td>
                      <td className="py-3 px-4 text-muted-foreground">
                        <div>{tenant.adminEmail}</div>
                        <div className="text-[10px] text-muted-foreground">@{tenant.adminUsername}</div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge status={tenant.status} />
                      </td>
                      <td className="py-3 px-4 text-muted-foreground font-medium text-[11px]">
                        {tenant.createdAt ? new Date(tenant.createdAt).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {tenant.status === 'PENDING' && (
                            <Button
                              variant="default"
                              size="xs"
                              disabled={isBusy}
                              onClick={() => handleAction(tenant.tenantId, 'approve')}
                              className="gap-1 text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white"
                            >
                              <CheckCircle2 className="size-3" /> Approve
                            </Button>
                          )}

                          {tenant.status === 'APPROVED' && (
                            <Button
                              variant="default"
                              size="xs"
                              disabled={isBusy}
                              onClick={() => handleAction(tenant.tenantId, 'activate')}
                              className="gap-1 text-[11px]"
                            >
                              <PlayCircle className="size-3" /> Activate
                            </Button>
                          )}

                          {tenant.status === 'ACTIVE' && (
                            <>
                              <Button
                                variant="outline"
                                size="xs"
                                disabled={isBusy}
                                onClick={() => handleAction(tenant.tenantId, 'suspend')}
                                className="gap-1 text-[11px] text-amber-500 hover:bg-amber-500/10"
                              >
                                <PauseCircle className="size-3" /> Suspend
                              </Button>
                              <Button
                                variant="outline"
                                size="xs"
                                disabled={isBusy}
                                onClick={() => handleAction(tenant.tenantId, 'deactivate')}
                                className="gap-1 text-[11px] text-red-500 hover:bg-red-500/10"
                              >
                                <AlertOctagon className="size-3" /> Deactivate
                              </Button>
                            </>
                          )}

                          {(tenant.status === 'SUSPENDED' || tenant.status === 'INACTIVE') && (
                            <Button
                              variant="outline"
                              size="xs"
                              disabled={isBusy}
                              onClick={() => handleAction(tenant.tenantId, 'activate')}
                              className="gap-1 text-[11px] text-emerald-500 hover:bg-emerald-500/10"
                            >
                              <PlayCircle className="size-3" /> Re-Activate
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {/* Pagination Controls */}
          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/20 text-xs">
              <span className="text-muted-foreground">
                Page {data.currentPage + 1} of {data.totalPages}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon-xs"
                  disabled={data.isFirstPage}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                >
                  <ChevronLeft className="size-3" />
                </Button>
                <Button
                  variant="outline"
                  size="icon-xs"
                  disabled={data.isLastPage}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight className="size-3" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
