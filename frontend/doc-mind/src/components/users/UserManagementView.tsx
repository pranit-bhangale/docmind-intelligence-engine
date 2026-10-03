import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Plus,
  ShieldCheck,
  RefreshCw,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Lock,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/button';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { userService } from '../../services/userService';
import { formatRoleLabel } from '../../utils/roleUtils';
import { useAuth } from '../../context/AuthContext';
import type { UserResponse } from '../../types/auth';
import type { PageResponse } from '../../types/api';

interface UserManagementViewProps {
  onOpenAddUserModal: () => void;
}

export const UserManagementView: React.FC<UserManagementViewProps> = ({
  onOpenAddUserModal,
}) => {
  const { isAuthenticated, canAccessUsers, canAccessTenants } = useAuth();
  const [data, setData] = useState<PageResponse<UserResponse> | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(0);
  const [size] = useState(10);

  const fetchUsers = useCallback(async () => {
    if (!isAuthenticated || !canAccessUsers) return;
    setLoading(true);
    setError(null);
    try {
      const res = await userService.getUsers({
        page,
        size,
        keyword: keyword || undefined,
        sortBy: 'username',
        sortDirection: 'ASC',
      });
      setData(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, canAccessUsers, page, size, keyword]);

  useEffect(() => {
    if (isAuthenticated && canAccessUsers) {
      fetchUsers();
    }
  }, [isAuthenticated, canAccessUsers, fetchUsers]);

  if (!canAccessUsers) {
    return (
      <div className="space-y-6">
        <div className="border-b border-border pb-4">
          <h1 className="text-xl font-bold tracking-tight text-foreground">User Directory & Access Control</h1>
          <p className="text-xs text-muted-foreground mt-0.5">User Management</p>
        </div>
        <Card className="p-8 text-center space-y-3">
          <div className="inline-flex size-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 mx-auto">
            <Lock className="size-6" />
          </div>
          <h2 className="text-base font-bold text-foreground">Access Restricted</h2>
        </Card>
      </div>
    );
  }

  const handleDeleteUser = async () => {
    if (confirm('Are you sure you want to soft-delete your user profile?')) {
      try {
        await userService.deleteProfile();
        await fetchUsers();
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : 'Delete failed');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border pb-4 gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            User Directory & Access Control
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage authenticated users, authorities, and account statuses
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchUsers} disabled={loading} className="gap-1.5">
            <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {!canAccessTenants && canAccessUsers && (
            <Button size="sm" onClick={onOpenAddUserModal} className="gap-1.5">
              <Plus className="size-3.5" />
              Add User Account
            </Button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <Card>
        <CardContent className="p-4 flex items-center justify-between gap-3">
          <div className="relative w-full max-w-sm">
            <Input
              placeholder="Search by username, email, or name..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              icon={<Search className="size-3.5" />}
            />
          </div>
        </CardContent>
      </Card>

      {/* Table Card */}
      <Card>
        <CardHeader className="pb-3 border-b border-border">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold">User Accounts</CardTitle>
            <span className="text-xs text-muted-foreground font-medium">
              Total: {data?.totalElements || 0} users
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {error && (
            <div className="p-4 m-4 rounded-lg border border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs flex items-center gap-2">
              <ShieldAlert className="size-4" />
              <span>Notice: {error}</span>
            </div>
          )}

          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Roles & Authorities</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {!data?.contents || data.contents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-muted-foreground">
                    No users found matching search query.
                  </td>
                </tr>
              ) : (
                data.contents.map((u) => {
                  const fullName = u.firstName ? `${u.firstName} ${u.lastName}` : u.username;

                  return (
                    <tr key={u.userId} className="hover:bg-muted/20 transition-colors">
                      <td className="py-3 px-4 font-semibold text-foreground">
                        <div className="flex items-center gap-2">
                          <div className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs">
                            {fullName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div>{fullName}</div>
                            <div className="text-[10px] text-muted-foreground font-medium">@{u.username}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">{u.email}</td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {u.authorities?.map((auth, idx) => (
                            <Badge key={idx} variant="outline" className="text-[9px] font-medium px-1.5 py-0">
                              <ShieldCheck className="size-2.5 mr-1 text-primary inline" />
                              {formatRoleLabel(auth.authority)}
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {u.deleted ? (
                          <Badge variant="destructive">Deleted</Badge>
                        ) : u.enabled ? (
                          <Badge variant="success">Active</Badge>
                        ) : (
                          <Badge variant="warning">Disabled</Badge>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={handleDeleteUser}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {/* Pagination */}
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
