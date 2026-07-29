import type { ReactNode } from 'react';

export function PublicContentPanel({ children, contentClassName = '' }: { children: ReactNode; contentClassName?: string }) {
  return <div className="flex min-w-0 items-start justify-center px-4 py-8 sm:px-8 sm:py-12 lg:items-center lg:px-12"><div className={`w-full max-w-xl ${contentClassName}`}>{children}</div></div>;
}
