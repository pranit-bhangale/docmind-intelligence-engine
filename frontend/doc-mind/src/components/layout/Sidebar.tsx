import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  Users,
  Settings,
  ChevronRight,
  ChevronLeft,
  Layers,
  FileText,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTenant } from '../../context/TenantContext';
import { Badge } from '../ui/Badge';
import { cn } from '../../lib/utils';
import { Logo } from '../common/Logo';

export type ActiveTab =
  | '/'
  | '/dashboard'
  | '/tenants'
  | '/users'
  | '/settings';

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

interface NavItemDef {
  path: ActiveTab;
  label: string;
  icon: React.ReactNode;
  badge?: string;
  adminOnly?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  onToggleCollapse,
}) => {
  const { isSuperAdmin, hasRole } = useAuth();
  const { activeTenant } = useTenant();
  const navigate = useNavigate();
  const location = useLocation();
  const [workspaceOpen, setWorkspaceOpen] = useState(true);

  const mainNavItems: NavItemDef[] = [
    { path: '/', label: 'Dashboard', icon: <LayoutDashboard className="size-4" /> },
  ];

  const workspaceNavItems: NavItemDef[] = [
    {
      path: '/tenants',
      label: 'Tenants',
      icon: <Building2 className="size-4" />,
      adminOnly: true,
    },
    { path: '/users', label: 'User Directory', icon: <Users className="size-4" /> },
    { path: '/settings', label: 'System Settings', icon: <Settings className="size-4" /> },
  ];

  const isPathActive = (path: ActiveTab) => {
    if (path === '/') {
      return location.pathname === '/' || location.pathname === '/dashboard' || location.pathname === '/overview';
    }
    return location.pathname === path;
  };

  return (
    <aside
      className={cn(
        'relative flex h-full flex-col justify-between border-r border-border bg-card/90 backdrop-blur-md transition-all duration-200 select-none z-30 overflow-x-hidden overflow-y-auto',
        isCollapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Brand Header */}
      <div className={cn('flex h-14 items-center border-b border-border', isCollapsed ? 'justify-center px-0' : 'justify-between px-3.5')}>
        <button
          onClick={isCollapsed ? onToggleCollapse : undefined}
          className="flex items-center gap-2.5 overflow-hidden text-left focus:outline-none"
        >
          <Logo size="sm" showText={!isCollapsed} />
        </button>

        {!isCollapsed && (
          <button
            onClick={onToggleCollapse}
            className="flex size-6 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-accent hover:text-foreground transition-colors shrink-0"
          >
            <ChevronLeft className="size-3.5" />
          </button>
        )}
      </div>

      {/* Tenant Context Bar */}
      {!isCollapsed && activeTenant && (
        <div className="mx-3 my-2.5 px-2.5 py-1.5 rounded-lg border border-border/60 bg-muted/30 text-[11px] flex items-center justify-between overflow-hidden">
          <div className="flex items-center gap-1.5 truncate">
            <Layers className="size-3 text-muted-foreground shrink-0" />
            <span className="text-muted-foreground truncate">{activeTenant.companyCode}</span>
          </div>
          <Badge status={activeTenant.status} className="text-[8px] px-1 py-0 shrink-0" />
        </div>
      )}

      {/* Main Navigation Items */}
      <div className="flex-1 px-2 py-3 space-y-4 overflow-x-hidden">
        {/* Section 1: Dashboard */}
        <div>
          {!isCollapsed && (
            <div className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80 truncate">
              Main Navigation
            </div>
          )}
          <nav className="space-y-1">
            {mainNavItems.map((item) => {
              const active = isPathActive(item.path);
              const button = (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={cn(
                    'group relative flex items-center rounded-lg text-xs font-medium transition-all duration-150',
                    isCollapsed ? 'size-9 justify-center mx-auto' : 'w-full gap-3 px-2.5 py-2 justify-start',
                    active
                      ? 'bg-primary/10 text-primary font-semibold'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                  )}
                >
                  {active && !isCollapsed && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-1 rounded-r-full bg-primary" />
                  )}
                  <span className={cn('shrink-0', active ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground')}>
                    {item.icon}
                  </span>
                  {!isCollapsed && <span className="truncate">{item.label}</span>}
                </button>
              );

              return button;
            })}
          </nav>
        </div>

        {/* Section 2: Workspace Management */}
        <div>
          {!isCollapsed && (
            <div
              onClick={() => setWorkspaceOpen(!workspaceOpen)}
              className="flex items-center justify-between px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80 cursor-pointer hover:text-foreground truncate"
            >
              <span className="truncate">Management</span>
              <ChevronRight
                className={cn('size-3 transition-transform duration-200 shrink-0', workspaceOpen && 'rotate-90')}
              />
            </div>
          )}
          {(workspaceOpen || isCollapsed) && (
            <nav className="space-y-1">
              {workspaceNavItems.map((item) => {
                if (item.adminOnly && !isSuperAdmin && !hasRole('ADMIN') && !hasRole('PLATFORM_ADMIN')) {
                  return null;
                }

                const active = isPathActive(item.path);
                const button = (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className={cn(
                      'group relative flex items-center rounded-lg text-xs font-medium transition-all duration-150',
                      isCollapsed ? 'size-9 justify-center mx-auto' : 'w-full justify-between px-2.5 py-2',
                      active
                        ? 'bg-primary/10 text-primary font-semibold'
                        : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                    )}
                  >
                    <div className={cn('flex items-center gap-3 truncate', isCollapsed ? 'justify-center' : '')}>
                      {active && !isCollapsed && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-1 rounded-r-full bg-primary" />
                      )}
                      <span className={cn('shrink-0', active ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground')}>
                        {item.icon}
                      </span>
                      {!isCollapsed && <span className="truncate">{item.label}</span>}
                    </div>

                    {!isCollapsed && item.badge && (
                      <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[9px] font-semibold text-primary shrink-0">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );

                return button;
              })}
            </nav>
          )}
        </div>
      </div>

      {/* Footer Utilities */}
      <div className="border-t border-border p-2 space-y-1 overflow-hidden">
        {isCollapsed && (
          <button
            onClick={onToggleCollapse}
            className="flex size-9 w-full items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors mx-auto"
          >
            <ChevronRight className="size-4" />
          </button>
        )}

        {!isCollapsed && (
          <div className="flex items-center justify-between px-2 py-1.5 text-[11px] text-muted-foreground truncate">
            <div className="flex items-center gap-1.5 truncate">
              <FileText className="size-3.5 text-muted-foreground shrink-0" />
              <span className="truncate font-medium">DocMind Engine</span>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
