import React, { useState, useEffect, useCallback } from 'react';
import {
  Building2,
  Users,
  Shield,
  ArrowUpRight,
  Plus,
  Clock,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../ui/Card';
import { Button } from '../ui/button';
import { Badge } from '../ui/Badge';
import { useTenant } from '../../context/TenantContext';
import { useAuth } from '../../context/AuthContext';
import { userService } from '../../services/userService';
import { roleService } from '../../services/roleService';
import { formatRoleLabel } from '../../utils/roleUtils';
import type { TenantResponse } from '../../types/tenant';
import type { UserResponse } from '../../types/auth';

interface DashboardViewProps {
  onNavigate: (path: string) => void;
  onOpenRegisterTenant: () => void;
  onOpenAddUser: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onOpenRegisterTenant,
  onOpenAddUser,
}) => {
  const { isAuthenticated, canAccessUsers, canAccessRoles, canAccessTenants, user } = useAuth();
  const { tenants, activeTenant, refreshTenants, isLoadingTenants } = useTenant();
  const [totalUsersCount, setTotalUsersCount] = useState<number>(0);
  const [recentUsers, setRecentUsers] = useState<UserResponse[]>([]);
  const [rolesCount, setRolesCount] = useState<number>(0);
  const [loadingMetrics, setLoadingMetrics] = useState<boolean>(true);

  const fetchBackendMetrics = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoadingMetrics(true);
    try {
      if (canAccessUsers) {
        const usersRes = await userService.getUsers({ page: 0, size: 5 });
        if (usersRes) {
          setTotalUsersCount(usersRes.totalElements ?? usersRes.contents?.length ?? 0);
          setRecentUsers(usersRes.contents ?? []);
        }
      }
      if (canAccessRoles) {
        const rolesRes = await roleService.getRoles();
        if (rolesRes) {
          setRolesCount(rolesRes.length);
        }
      }
    } catch {
      // Silently swallow metric errors
    } finally {
      setLoadingMetrics(false);
    }
  }, [isAuthenticated, canAccessUsers, canAccessRoles]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchBackendMetrics();
    }
  }, [isAuthenticated, fetchBackendMetrics]);

  const handleRefresh = async () => {
    if (canAccessTenants) {
      await refreshTenants();
    }
    await fetchBackendMetrics();
  };

  const activeTenantsCount = tenants.filter((t: TenantResponse) => t.status === 'ACTIVE').length;
  const pendingTenantsCount = tenants.filter((t: TenantResponse) => t.status === 'PENDING').length;
  const approvedTenantsCount = tenants.filter((t: TenantResponse) => t.status === 'APPROVED').length;
  const suspendedTenantsCount = tenants.filter((t: TenantResponse) => t.status === 'SUSPENDED').length;

  const tenantStatusChartData = [
    { name: 'Active', value: activeTenantsCount, color: '#10b981' },
    { name: 'Pending', value: pendingTenantsCount, color: '#f59e0b' },
    { name: 'Approved', value: approvedTenantsCount, color: '#3b82f6' },
    { name: 'Suspended', value: suspendedTenantsCount, color: '#ef4444' },
  ].filter((item) => item.value > 0);

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            System Overview & Operations
          </h1>
          <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
            <div>
              Active User: <span className="font-semibold text-foreground">{user?.username || 'Guest'}</span>
            </div>
            {activeTenant && (
              <div>
                Active Workspace: <span className="font-semibold text-foreground">{activeTenant.companyName} ({activeTenant.companyCode})</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoadingTenants || loadingMetrics}
            className="gap-1.5 text-xs"
          >
            <RefreshCw className={`size-3.5 ${isLoadingTenants || loadingMetrics ? 'animate-spin' : ''}`} />
            Refresh Telemetry
          </Button>
          {canAccessUsers && (
            <Button variant="outline" size="sm" onClick={onOpenAddUser} className="gap-1.5 text-xs">
              <Users className="size-3.5" />
              Add User
            </Button>
          )}
          {canAccessTenants && (
            <Button size="sm" onClick={onOpenRegisterTenant} className="gap-1.5 text-xs">
              <Plus className="size-3.5" />
              Register Tenant
            </Button>
          )}
        </div>
      </div>

      {/* PLATFORM ADMIN METRICS GRID */}
      {canAccessTenants ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="hover:border-border/80 transition-all">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Total Registered Tenants</span>
                <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Building2 className="size-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-2xl font-bold text-foreground">{tenants.length}</span>
                <Badge variant="secondary" className="text-[9px]">
                  {activeTenantsCount} Active
                </Badge>
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {pendingTenantsCount} pending review
              </p>
            </CardContent>
          </Card>

          <Card className="hover:border-border/80 transition-all">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Pending Approvals</span>
                <div className="flex size-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
                  <Clock className="size-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-2xl font-bold text-foreground">{pendingTenantsCount}</span>
                <Badge variant={pendingTenantsCount > 0 ? 'warning' : 'secondary'} className="text-[9px]">
                  {pendingTenantsCount > 0 ? 'Action Needed' : 'All Approved'}
                </Badge>
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Tenants awaiting platform admin approval
              </p>
            </CardContent>
          </Card>

          <Card className="hover:border-border/80 transition-all">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Total User Accounts</span>
                <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
                  <Users className="size-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-2xl font-bold text-foreground">{totalUsersCount}</span>
                <Badge variant="secondary" className="text-[9px]">
                  Directory Synced
                </Badge>
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Registered users in system
              </p>
            </CardContent>
          </Card>

          <Card className="hover:border-border/80 transition-all">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Defined System Roles</span>
                <div className="flex size-8 items-center justify-center rounded-lg bg-purple-500/10 text-purple-500">
                  <Shield className="size-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-2xl font-bold text-foreground">{rolesCount}</span>
                <Badge variant="secondary" className="text-[9px]">
                  RBAC Active
                </Badge>
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Active Context: Platform
              </p>
            </CardContent>
          </Card>
        </div>
      ) : (
        /* COMPANY ADMIN / TENANT USER METRICS GRID */
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="hover:border-border/80 transition-all">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Organization User Accounts</span>
                <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
                  <Users className="size-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-2xl font-bold text-foreground">{totalUsersCount}</span>
                <Badge variant="secondary" className="text-[9px]">
                  Directory Active
                </Badge>
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Active user accounts in organization
              </p>
            </CardContent>
          </Card>

          <Card className="hover:border-border/80 transition-all">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Defined System Roles</span>
                <div className="flex size-8 items-center justify-center rounded-lg bg-purple-500/10 text-purple-500">
                  <Shield className="size-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-2xl font-bold text-foreground">{rolesCount || 4}</span>
                <Badge variant="secondary" className="text-[9px]">
                  RBAC Defined
                </Badge>
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">
                System authority specifications
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      {canAccessTenants ? (
        /* PLATFORM ADMIN DIRECTORY & CHART */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-sm font-semibold">Registered Tenants Directory</CardTitle>
                <CardDescription className="text-xs">
                  Real tenant organization instances fetched from backend
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="xs"
                onClick={() => onNavigate('/tenants')}
                className="gap-1 text-xs text-primary"
              >
                Manage Tenants <ArrowUpRight className="size-3" />
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {tenants.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted-foreground">
                  {isLoadingTenants ? 'Loading tenants from backend...' : 'No tenants found in backend repository.'}
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {tenants.slice(0, 5).map((t: TenantResponse) => (
                    <div key={t.tenantId} className="flex items-center justify-between p-4 hover:bg-muted/20 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 font-bold text-primary text-xs">
                          {t.companyName ? t.companyName.charAt(0).toUpperCase() : 'T'}
                        </div>
                        <div>
                          <div className="font-semibold text-xs text-foreground">{t.companyName}</div>
                          <div className="text-[10px] text-muted-foreground">
                            Code: {t.companyCode} • Admin: {t.adminUsername}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] text-muted-foreground hidden sm:inline">
                          {t.createdAt ? new Date(t.createdAt).toLocaleDateString() : 'N/A'}
                        </span>
                        <Badge status={t.status} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Tenant Status Distribution</CardTitle>
              <CardDescription className="text-xs">
                Live status breakdown across active organization instances
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center pt-2">
              {tenantStatusChartData.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted-foreground">
                  No tenant status data available.
                </div>
              ) : (
                <>
                  <div className="h-44 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={tenantStatusChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={70}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {tenantStatusChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <RechartsTooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="w-full space-y-2 pt-2 border-t border-border">
                    {tenantStatusChartData.map((item) => (
                      <div key={item.name} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="size-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                          <span className="text-muted-foreground">{item.name}</span>
                        </div>
                        <span className="font-bold text-foreground">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        /* COMPANY ADMIN USER DIRECTORY PREVIEW & WORKSPACE SUMMARY */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-sm font-semibold">Organization User Directory</CardTitle>
                <CardDescription className="text-xs">
                  Active user accounts within your company tenant
                </CardDescription>
              </div>
              {canAccessUsers && (
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => onNavigate('/users')}
                  className="gap-1 text-xs text-primary"
                >
                  Manage Users <ArrowUpRight className="size-3" />
                </Button>
              )}
            </CardHeader>
            <CardContent className="p-0">
              {recentUsers.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted-foreground">
                  No users found in organization directory.
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {recentUsers.map((u: UserResponse) => {
                    const fullName = u.firstName ? `${u.firstName} ${u.lastName}` : u.username;
                    return (
                      <div key={u.userId} className="flex items-center justify-between p-4 hover:bg-muted/20 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs">
                            {fullName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-xs text-foreground">{fullName}</div>
                            <div className="text-[10px] text-muted-foreground">
                              @{u.username} • {u.email}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {u.authorities?.map((auth, idx) => (
                            <Badge key={idx} variant="outline" className="text-[9px] px-1.5 py-0">
                              <ShieldCheck className="size-2.5 mr-1 text-primary inline" />
                              {formatRoleLabel(auth.authority)}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Workspace Context Summary</CardTitle>
              <CardDescription className="text-xs">
                Active tenant configuration & details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="flex justify-between p-2.5 rounded-lg border border-border bg-muted/20">
                <span className="text-muted-foreground">Company Name</span>
                <span className="font-semibold truncate max-w-[140px]">
                  {activeTenant?.companyName || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between p-2.5 rounded-lg border border-border bg-muted/20">
                <span className="text-muted-foreground">Company Code</span>
                <span className="font-semibold">
                  {activeTenant?.companyCode || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between p-2.5 rounded-lg border border-border bg-muted/20">
                <span className="text-muted-foreground">Contact Email</span>
                <span className="font-semibold truncate max-w-[150px]">
                  {activeTenant?.email || activeTenant?.adminEmail || user?.email || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between p-2.5 rounded-lg border border-border bg-muted/20">
                <span className="text-muted-foreground">Tenant Status</span>
                {activeTenant?.status ? (
                  <Badge status={activeTenant.status} className="text-[9px] px-1.5 py-0" />
                ) : (
                  <Badge variant="success" className="text-[9px] px-1.5 py-0">Active</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
