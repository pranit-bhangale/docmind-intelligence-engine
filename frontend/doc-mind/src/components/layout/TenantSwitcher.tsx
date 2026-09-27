import React, { useState, useRef, useEffect } from 'react';
import { Building2, ChevronDown, Check, Plus, Search } from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';
import type { TenantResponse } from '../../types/tenant';

interface TenantSwitcherProps {
  onOpenRegisterModal: () => void;
}

export const TenantSwitcher: React.FC<TenantSwitcherProps> = ({ onOpenRegisterModal }) => {
  const { activeTenant, tenants, setActiveTenant, isLoadingTenants } = useTenant();
  const { canAccessTenants } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
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

  const filteredTenants = tenants.filter(
    (t) =>
      t.companyName?.toLowerCase().includes(search.toLowerCase()) ||
      t.companyCode?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (tenant: TenantResponse) => {
    setActiveTenant(tenant);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-border bg-background hover:bg-accent/50 text-foreground transition-all duration-150 focus:outline-none focus:ring-1 focus:ring-ring text-xs font-medium',
          isOpen && 'bg-accent/50 border-ring/50'
        )}
      >
        <div className="flex size-5 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary font-bold text-[10px]">
          {activeTenant?.companyName ? activeTenant.companyName.charAt(0).toUpperCase() : 'T'}
        </div>
        <span className="truncate max-w-[130px] sm:max-w-[170px] text-foreground font-semibold">
          {activeTenant ? activeTenant.companyName : isLoadingTenants ? 'Loading...' : 'Workspace'}
        </span>
        {activeTenant?.status && (
          <Badge status={activeTenant.status} className="hidden lg:inline-flex text-[9px] px-1.5 py-0" />
        )}
        {canAccessTenants && (
          <ChevronDown className={cn('size-3.5 text-muted-foreground transition-transform duration-200', isOpen && 'rotate-180')} />
        )}
      </button>

      {isOpen && canAccessTenants && (
        <div className="absolute left-0 top-full mt-1.5 w-64 rounded-xl border border-border bg-card p-1.5 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Active Tenant Workspace
          </div>

          <div className="relative my-1 px-1">
            <Search className="absolute left-3 top-2.5 size-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search tenant..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-md border border-input bg-background pl-8 pr-2 py-1 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          <div className="max-h-48 overflow-y-auto space-y-0.5 my-1">
            {filteredTenants.length === 0 ? (
              <div className="px-3 py-3 text-xs text-muted-foreground text-center">
                {isLoadingTenants ? 'Fetching backend tenants...' : 'No tenants found'}
              </div>
            ) : (
              filteredTenants.map((tenant) => {
                const isSelected = activeTenant?.tenantId === tenant.tenantId;
                return (
                  <button
                    key={tenant.tenantId}
                    onClick={() => handleSelect(tenant)}
                    className={cn(
                      'flex items-center justify-between w-full px-2.5 py-2 rounded-md text-xs transition-colors text-left',
                      isSelected ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-accent hover:text-foreground text-muted-foreground'
                    )}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Building2 className="size-3.5 shrink-0" />
                      <div className="truncate">
                        <div className="truncate font-medium text-foreground">{tenant.companyName}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Badge status={tenant.status} className="text-[9px] px-1 py-0" />
                      {isSelected && <Check className="size-3.5 text-primary shrink-0" />}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          <div className="border-t border-border pt-1 mt-1">
            <Button
              variant="ghost"
              size="xs"
              onClick={() => {
                setIsOpen(false);
                onOpenRegisterModal();
              }}
              className="w-full justify-start text-xs font-medium gap-1.5 text-muted-foreground hover:text-foreground"
            >
              <Plus className="size-3.5" />
              Register New Tenant
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
