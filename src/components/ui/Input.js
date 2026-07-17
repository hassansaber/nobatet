'use client';

import { useId, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Accessible Input - WCAG AA compliant
 * - min 44px touch target
 * - visible label, error with role alert + aria-live
 * - password toggle
 * - autocomplete support
 */
export function Input({ label, error, hint, className, id, required, type, ...props }) {
  const autoId = useId();
  const inputId = id || props.name || `input-${autoId}`;
  const errorId = `${inputId}-error`;
  const hintId = `${inputId}-hint`;
  const [showPassword, setShowPassword] = useState(false);

  const isPassword = type === 'password';
  const actualType = isPassword && showPassword ? 'text' : type;

  const describedBy = [
    error ? errorId : null,
    hint && !error ? hintId : null,
    props['aria-describedby'],
  ]
    .filter(Boolean)
    .join(' ') || undefined;

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block text-[13px] font-bold text-foreground cursor-pointer">
          {label}
          {required && <span className="text-destructive ms-1" aria-hidden>*</span>}
          {required && <span className="sr-only"> (الزامی)</span>}
        </label>
      )}
      <div className="relative">
        <input
          id={inputId}
          type={actualType}
          required={required}
          aria-required={required ? 'true' : undefined}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={describedBy}
          className={cn(
            'w-full h-12 px-4 rounded-xl border bg-white text-[15px] font-semibold text-foreground',
            'placeholder:text-muted-foreground/60 placeholder:font-medium',
            'transition-all duration-200 ease-out',
            'focus:outline-none focus:ring-[3px] focus:ring-primary/20 focus:border-primary focus-visible:ring-[3px]',
            'read-only:bg-slate-50 read-only:text-foreground/80 read-only:border-border/50',
            'disabled:opacity-50 disabled:pointer-events-none',
            'min-h-[44px]',
            isPassword ? 'pe-11' : '',
            error ? 'border-destructive focus:border-destructive focus:ring-destructive/20' : 'border-border',
            className,
          )}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? 'مخفی کردن رمز' : 'نمایش رمز'}
            aria-pressed={showPassword}
            className="absolute inset-y-0 end-2 flex items-center justify-center size-8 self-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        )}
      </div>
      {error && (
        <p id={errorId} role="alert" aria-live="polite" className="text-xs font-bold text-destructive flex items-start gap-1.5 mt-1.5">
          <span aria-hidden>⚠</span> {error}
        </p>
      )}
      {hint && !error && (
        <p id={hintId} className="text-[11px] text-muted-foreground leading-5">
          {hint}
        </p>
      )}
    </div>
  );
}
