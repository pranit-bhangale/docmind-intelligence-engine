import React from 'react';
import { cn } from '../../lib/utils';
import type { TenantStatus } from '../../types/tenant';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'destructive' | 'success' | 'warning' | 'info';
  status?: TenantStatus | string;
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'default',
  status,
  children,
  ...props
}) => {
  let resolvedVariant = variant;
  let text = children;

  if (status) {
    text = status;
    switch (status.toUpperCase()) {
      case 'ACTIVE':
      case 'APPROVED':
        resolvedVariant = 'success';
        break;
      case 'PENDING':
      case 'PROVISIONING':
        resolvedVariant = 'warning';
        break;
      case 'SUSPENDED':
      case 'INACTIVE':
        resolvedVariant = 'destructive';
        break;
      default:
        resolvedVariant = 'secondary';
    }
  }

  const baseStyles =
    'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2';

  const variantStyles = {
    default: 'bg-primary/10 text-primary border border-primary/20',
    secondary: 'bg-secondary text-secondary-foreground border border-border',
    outline: 'text-foreground border border-border bg-background',
    destructive: 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20',
    success: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
    warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20',
    info: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20',
  };

  return (
    <div className={cn(baseStyles, variantStyles[resolvedVariant], className)} {...props}>
      {text}
    </div>
  );
};
