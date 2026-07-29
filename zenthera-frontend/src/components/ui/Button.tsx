import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

const variantClassName: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-primary-foreground shadow-[var(--shadow-sm)] hover:bg-primary-hover',
  secondary: 'border border-border bg-surface text-foreground hover:bg-surface-muted',
  ghost: 'text-foreground hover:bg-surface-muted',
};

const sizeClassName: Record<ButtonSize, string> = {
  sm: 'min-h-9 px-3 text-sm',
  md: 'min-h-11 px-4 text-sm',
  lg: 'min-h-12 px-5 text-base',
};

export function Button({ children, className = '', disabled, loading = false, size = 'md', type = 'button', variant = 'primary', ...props }: ButtonProps) {
  return (
    <button {...props} type={type} disabled={disabled || loading} aria-busy={loading || undefined} className={`inline-flex w-full items-center justify-center gap-2 rounded-[var(--radius-md)] font-semibold transition-colors focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto ${variantClassName[variant]} ${sizeClassName[size]} ${className}`}>
      {loading && <span aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />}
      <span>{children}</span>
    </button>
  );
}
