import React from 'react';
import {
  Sun,
  Moon,
  Search,
  Menu,
  Command,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { TenantSwitcher } from './TenantSwitcher';
import { UserDropdown } from './UserDropdown';
import { Button } from '../ui/button';
import { Badge } from '../ui/Badge';
import { Tooltip } from '../ui/Tooltip';

interface TopNavProps {
  onToggleMobileDrawer: () => void;
  onOpenCommandK: () => void;
  onOpenRegisterTenantModal: () => void;
  onOpenSettingsModal: () => void;
  onOpenLoginModal: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  onToggleMobileDrawer,
  onOpenCommandK,
  onOpenRegisterTenantModal,
  onOpenSettingsModal,
  onOpenLoginModal,
}) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-40 flex h-14 w-full items-center justify-between border-b border-border bg-card/80 px-4 backdrop-blur-md transition-colors">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onToggleMobileDrawer}
          className="md:hidden text-muted-foreground hover:text-foreground"
        >
          <Menu className="size-4" />
        </Button>

        {/* Tenant Switcher */}
        <TenantSwitcher onOpenRegisterModal={onOpenRegisterTenantModal} />

        <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-border">
          <Badge variant="outline" className="gap-1 text-[10px] text-muted-foreground py-0.5">
            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
            docmind Online
          </Badge>
        </div>
      </div>

      {/* Global Search / Command Bar */}
      <div className="flex items-center gap-2 max-w-md w-full mx-4 hidden md:flex">
        <button
          onClick={onOpenCommandK}
          className="flex items-center justify-between w-full h-8 px-3 rounded-lg border border-input bg-background/50 hover:bg-accent/40 text-xs text-muted-foreground transition-all group"
        >
          <div className="flex items-center gap-2">
            <Search className="size-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
            <span>Search tenants, users, settings...</span>
          </div>
          <kbd className="inline-flex items-center gap-0.5 rounded border border-border bg-muted px-1.5 text-[10px] text-muted-foreground">
            <Command className="size-2.5" /> K
          </kbd>
        </button>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-1.5">
        <Tooltip content="Quick Command Palette (Ctrl+K)">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onOpenCommandK}
            className="md:hidden text-muted-foreground hover:text-foreground"
          >
            <Search className="size-4" />
          </Button>
        </Tooltip>

        <Tooltip content={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={toggleTheme}
            className="text-muted-foreground hover:text-foreground transition-transform active:scale-95"
          >
            {theme === 'dark' ? <Sun className="size-4 text-amber-400" /> : <Moon className="size-4" />}
          </Button>
        </Tooltip>

        <div className="h-4 w-px bg-border mx-1" />

        <UserDropdown
          onOpenSettings={onOpenSettingsModal}
          onOpenLoginModal={onOpenLoginModal}
        />
      </div>
    </header>
  );
};
