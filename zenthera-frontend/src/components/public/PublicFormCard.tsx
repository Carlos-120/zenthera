import type { ReactNode } from 'react';

export interface PublicFormCardProps { children: ReactNode; className?: string; title?: string; description?: string; }

export function PublicFormCard({ children, className = '', description, title }: PublicFormCardProps) {
  return (
    <section className={`rounded-[var(--radius-lg)] border border-border bg-surface p-6 shadow-[var(--shadow-md)] sm:p-8 ${className}`}>
      {(title || description) && <header className="mb-7 text-center">{title && <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{title}</h1>}{description && <p className="mt-2 text-sm leading-6 text-foreground-muted">{description}</p>}</header>}
      {children}
    </section>
  );
}
