'use client';

import { cn } from '@/lib/utils';

const variants = {
  primary:
    'bg-primary text-primary-foreground hover:bg-secondary shadow-sm shadow-primary/20 focus-visible:ring-primary/30',
  secondary:
    'bg-white text-foreground border border-border hover:bg-muted focus-visible:ring-primary/20',
  ghost: 'bg-transparent text-foreground hover:bg-muted focus-visible:ring-primary/20',
  danger: 'bg-destructive text-white hover:bg-red-700 focus-visible:ring-destructive/30',
  outline:
    'bg-transparent border-2 border-primary text-primary hover:bg-primary hover:text-white focus-visible:ring-primary/30',
};

const sizes = {
  sm: 'h-11 min-h-[44px] px-4 text-sm font-bold rounded-xl', // 44px min for a11y
  md: 'h-12 min-h-[48px] px-5 text-[15px] font-bold rounded-xl', // 48px
  lg: 'h-14 min-h-[56px] px-6 text-[16px] font-black rounded-xl',
};

/**
 * Accessible Button - WCAG AA
 * - min 44x44 touch target
 * - focus-visible ring
 * - cursor-pointer
 * - loading with aria-busy and spinner with aria-hidden
 * - disabled with aria-disabled
 */
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className,
  loading = false,
  disabled,
  type = 'button',
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-disabled={disabled || loading ? 'true' : undefined}
      aria-busy={loading ? 'true' : undefined}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-bold transition-all duration-200 ease-out',
        'cursor-pointer select-none',
        'focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-offset-2',
        'active:scale-[0.98] active:transition-none',
        'disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed',
        'min-w-[44px] min-h-[44px]', // ensure touch target
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {loading && (
        <span
          className="size-4 border-2 border-current border-t-transparent rounded-full animate-spin-slow"
          aria-hidden="true"
        />
      )}
      {children}
    </button>
  );
}
