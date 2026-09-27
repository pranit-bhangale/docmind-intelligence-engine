import React, { useState, useRef, useEffect } from 'react';
import { User, Key, LogOut, ChevronDown, ShieldCheck, UserCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';
import { Badge } from '../ui/Badge';

import { formatRoleLabel } from '../../utils/roleUtils';

interface UserDropdownProps {
  onOpenSettings: () => void;
  onOpenLoginModal: () => void;
}

export const UserDropdown: React.FC<UserDropdownProps> = ({
  onOpenSettings,
  onOpenLoginModal,
}) => {
  const { user, isAuthenticated, logout, isSuperAdmin } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isAuthenticated || !user) {
    return (
      <button
        onClick={onOpenLoginModal}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-xs"
      >
        <UserCheck className="size-3.5" />
        Sign In
      </button>
    );
  }

  const userInitial = user.firstName ? user.firstName.charAt(0).toUpperCase() : user.username.charAt(0).toUpperCase();
  const primaryRole = isSuperAdmin ? 'ROLE_PLATFORM_ADMIN' : user.authorities?.[0]?.authority;
  const roleLabel = formatRoleLabel(primaryRole);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-accent/50 transition-colors focus:outline-none focus:ring-1 focus:ring-ring text-left"
      >
        <div className="flex size-7 items-center justify-center rounded-full bg-gradient-to-tr from-primary to-primary/70 text-primary-foreground font-bold text-xs shadow-xs">
          {userInitial}
        </div>
        <div className="hidden md:block text-left text-xs leading-tight">
          <div className="font-semibold text-foreground truncate max-w-[110px]">
            {user.firstName ? `${user.firstName} ${user.lastName}` : user.username}
          </div>
          <div className="text-[10px] text-muted-foreground truncate">{roleLabel}</div>
        </div>
        <ChevronDown className={cn('size-3.5 text-muted-foreground transition-transform duration-200', isOpen && 'rotate-180')} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1.5 w-56 rounded-xl border border-border bg-card p-1.5 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-3 py-2 border-b border-border mb-1">
            <div className="font-medium text-xs text-foreground truncate">
              {user.firstName ? `${user.firstName} ${user.lastName}` : user.username}
            </div>
            <div className="text-[11px] text-muted-foreground truncate">{user.email}</div>
            <div className="mt-1.5 flex items-center gap-1">
              <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                <ShieldCheck className="size-2.5 mr-1 text-primary inline" />
                {roleLabel}
              </Badge>
            </div>
          </div>

          <button
            onClick={() => {
              setIsOpen(false);
              onOpenSettings();
            }}
            className="flex items-center gap-2.5 w-full px-2.5 py-1.5 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <User className="size-3.5" />
            Account & Profile
          </button>

          <button
            onClick={() => {
              setIsOpen(false);
              onOpenSettings();
            }}
            className="flex items-center gap-2.5 w-full px-2.5 py-1.5 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <Key className="size-3.5" />
            Security & Password
          </button>

          <div className="border-t border-border pt-1 mt-1">
            <button
              onClick={async () => {
                setIsOpen(false);
                await logout();
              }}
              className="flex items-center gap-2.5 w-full px-2.5 py-1.5 rounded-md text-xs text-destructive hover:bg-destructive/10 transition-colors"
            >
              <LogOut className="size-3.5" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
