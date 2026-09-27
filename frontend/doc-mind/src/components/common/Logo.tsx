import React from 'react';
import { Sparkles } from 'lucide-react';
import { cn } from '../../lib/utils';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
  subtitle?: string;
  onClick?: () => void;
}

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  showText = true,
  className,
  subtitle = 'Intelligence Engine',
  onClick,
}) => {
  const iconSizes = {
    sm: 'size-7 rounded-[10px]',
    md: 'size-9 rounded-[12px]',
    lg: 'size-11 rounded-[14px]',
  };

  const sparkleSizes = {
    sm: 'size-4',
    md: 'size-5',
    lg: 'size-6',
  };

  const titleSizes = {
    sm: 'text-xs font-bold tracking-tight',
    md: 'text-sm font-bold tracking-tight',
    lg: 'text-xl font-extrabold tracking-tight',
  };

  const subtitleSizes = {
    sm: 'text-[9px]',
    md: 'text-[10px]',
    lg: 'text-xs font-medium',
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-2.5 select-none transition-all duration-200',
        onClick && 'cursor-pointer hover:opacity-90',
        className
      )}
    >
      {/* Sleek Rounded Square Emblem Container */}
      <div
        className={cn(
          'flex shrink-0 items-center justify-center bg-secondary dark:bg-zinc-800 text-foreground border border-border/80 shadow-xs transition-transform hover:scale-105',
          iconSizes[size]
        )}
      >
        <Sparkles className={cn(sparkleSizes[size], 'text-foreground')} />
      </div>

      {/* Brand Text */}
      {showText && (
        <div className="flex flex-col text-left leading-none">
          <span className={cn('text-foreground font-sans font-bold', titleSizes[size])}>
            Docmind
          </span>
          {subtitle && (
            <span className={cn('text-muted-foreground mt-0.5 font-sans', subtitleSizes[size])}>
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
