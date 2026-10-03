import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Building2,
  Users,
  Settings,
  LayoutDashboard,
  Sparkles,
  Layers,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTenant } from '../../context/TenantContext';
import { KnowledgeSection } from '../knowledge/KnowledgeSection';
import { Badge } from '../ui/Badge';
import { Logo } from '../common/Logo';
import { cn } from '../../lib/utils';

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  onToggleCollapse,
}) => {
  const { canAccessTenants, canAccessUsers, isAdmin } = useAuth();
  const { activeTenant } = useTenant();

  const navigate = useNavigate();
  const location = useLocation();

  const adminNavItems = [
    { path: '/dashboard', label: 'Dashboard Overview', icon: <LayoutDashboard className="size-4" />, visible: true },
    { path: '/tenants', label: 'Tenants Directory', icon: <Building2 className="size-4" />, visible: canAccessTenants },
    { path: '/users', label: 'User Directory', icon: <Users className="size-4" />, visible: canAccessUsers },
    { path: '/settings', label: 'System Settings', icon: <Settings className="size-4" />, visible: true },
  ].filter((item) => item.visible);

  return (
    <aside
      className={cn(
        'relative flex h-full flex-col justify-between border-r border-border/70 bg-card/95 backdrop-blur-md transition-all duration-200 select-none z-30 overflow-x-hidden overflow-y-auto',
        isCollapsed ? 'w-16' : 'w-72'
      )}
    >
      {/* Top Header: Logo (Clicking logo toggles sidebar minimize/maximize) */}
      <div
        className={cn(
          'flex h-14 items-center border-b border-border/60 transition-all cursor-pointer hover:bg-accent/40',
          isCollapsed ? 'justify-center px-0' : 'px-3.5 justify-start'
        )}
        onClick={onToggleCollapse}
        title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        <div className="flex items-center gap-2 overflow-hidden text-left">
          <Logo size="sm" showText={!isCollapsed} />
        </div>
      </div>

      {/* Main Sidebar Scroll Area */}
      <div className="flex-1 px-2.5 py-3 space-y-4 overflow-x-hidden">
        {/* Tenant Active Badge */}
        {!isCollapsed && activeTenant && (
          <div className="mx-0.5 px-2.5 py-1.5 rounded-lg border border-border/60 bg-muted/20 text-[11px] flex items-center justify-between overflow-hidden">
            <div className="flex items-center gap-1.5 truncate">
              <Layers className="size-3 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground truncate">{activeTenant.companyName || activeTenant.companyCode}</span>
            </div>
            <Badge status={activeTenant.status} className="text-[8px] px-1 py-0 shrink-0" />
          </div>
        )}

        {isAdmin ? (
          /* Admin Operations Navigation */
          <div className="space-y-1">
            {!isCollapsed && (
              <div className="px-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80 mb-2">
                Operations & Management
              </div>
            )}
            <nav className="space-y-1">
              {adminNavItems.map((item) => {
                const isActive =
                  location.pathname === item.path ||
                  (item.path === '/dashboard' && (location.pathname === '/' || location.pathname === '/overview'));
                return (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    title={isCollapsed ? item.label : undefined}
                    className={cn(
                      'flex items-center gap-2.5 w-full rounded-xl transition-all text-left font-medium',
                      isCollapsed ? 'justify-center p-2.5' : 'px-3 py-2 text-xs',
                      isActive
                        ? 'bg-primary/10 text-primary font-semibold border border-primary/20 shadow-xs'
                        : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                    )}
                  >
                    <span className="shrink-0">{item.icon}</span>
                    {!isCollapsed && <span className="truncate">{item.label}</span>}
                  </button>
                );
              })}
            </nav>
          </div>
        ) : (
          /* User Knowledge Base Workspace Section */
          <KnowledgeSection isCollapsed={isCollapsed} />
        )}
      </div>

      {/* Footer Branding */}
      <div className="border-t border-border/60 p-2 text-[11px] text-muted-foreground">
        {!isCollapsed ? (
          <div className="flex items-center gap-2 px-2 py-1">
            <Sparkles className="size-3.5 text-primary shrink-0" />
            <span className="font-semibold text-foreground text-xs">
              {isAdmin ? 'DocMind Admin Console' : 'DocMind Engine'}
            </span>
          </div>
        ) : (
          <div className="flex justify-center py-1">
            <Sparkles className="size-4 text-primary" />
          </div>
        )}
      </div>
    </aside>
  );
};
