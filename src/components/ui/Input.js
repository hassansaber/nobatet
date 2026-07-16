'use client';

import { cn } from '@/lib/utils';

/**
 * @param {{
 *  label?: string,
 *  error?: string,
 *  hint?: string,
 *  className?: string,
 *  id?: string,
 * } & React.InputHTMLAttributes<HTMLInputElement>} props
 */
export function Input({ label, error, hint, className, id, ...props }) {
  const inputId = id || props.name;

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-base font-bold text-foreground"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={cn(
          'w-full h-12 px-4 rounded-xl border bg-white text-base font-semibold text-foreground',
          'placeholder:text-muted-foreground/70 placeholder:font-medium',
          'transition-colors duration-150',
          'focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary',
          'read-only:bg-slate-50 read-only:text-foreground/90',
          error ? 'border-danger' : 'border-border',
          className,
        )}
        {...props}
      />
      {error && <p className="text-sm font-semibold text-danger">{error}</p>}
      {hint && !error && (
        <p className="text-sm text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}
