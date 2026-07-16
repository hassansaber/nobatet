'use client';

import { cn } from '@/lib/utils';

const variants = {
  primary:
    'bg-primary text-primary-foreground hover:bg-secondary shadow-sm shadow-teal-900/10',
  secondary:
    'bg-white text-foreground border border-border hover:bg-muted',
  ghost: 'bg-transparent text-foreground hover:bg-muted',
  danger: 'bg-danger text-white hover:bg-red-700',
  outline:
    'bg-transparent border-2 border-primary text-primary hover:bg-primary hover:text-white',
};

const sizes = {
  sm: 'h-10 px-3.5 text-sm font-bold rounded-xl',
  md: 'h-12 px-5 text-base font-bold rounded-xl',
  lg: 'h-13 px-6 text-lg font-black rounded-xl',
};

/**
 * @param {{
 *  children: React.ReactNode,
 *  variant?: keyof typeof variants,
 *  size?: keyof typeof sizes,
 *  className?: string,
 *  loading?: boolean,
 *  disabled?: boolean,
 *  type?: 'button' | 'submit' | 'reset',
 *  onClick?: () => void,
 * }} props
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
      className={cn(
        'inline-flex items-center justify-center gap-2 font-bold transition-all duration-200',
        'disabled:opacity-60 disabled:pointer-events-none active:scale-[0.98]',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {loading && (
        <span
          className="size-4 border-2 border-current border-t-transparent rounded-full animate-spin-slow"
          aria-hidden
        />
      )}
      {children}
    </button>
  );
}
