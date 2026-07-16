import { cn } from '@/lib/utils';

export function Card({ children, className }) {
  return (
    <div
      className={cn(
        'bg-card border border-border rounded-2xl shadow-sm shadow-slate-900/5',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className }) {
  return (
    <div className={cn('px-5 pt-5 pb-2', className)}>{children}</div>
  );
}

export function CardTitle({ children, className }) {
  return (
    <h3 className={cn('text-lg font-bold tracking-tight', className)}>
      {children}
    </h3>
  );
}

export function CardDescription({ children, className }) {
  return (
    <p className={cn('text-sm text-muted-foreground mt-1', className)}>
      {children}
    </p>
  );
}

export function CardContent({ children, className }) {
  return <div className={cn('px-5 pb-5', className)}>{children}</div>;
}
