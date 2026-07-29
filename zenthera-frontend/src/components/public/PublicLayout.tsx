import type { ReactNode } from 'react';
import { PublicBrandPanel } from './PublicBrandPanel';
import { PublicContentPanel } from './PublicContentPanel';

export function PublicLayout({ children, contentClassName = '' }: { children: ReactNode; contentClassName?: string }) {
  return (
    <div className="min-h-screen overflow-x-hidden bg-background lg:grid lg:grid-cols-[minmax(0,47fr)_minmax(0,53fr)]">
      <aside aria-label="Información de Zenthera" className="lg:min-h-screen"><PublicBrandPanel /></aside>
      <main aria-label="Acceso y registro de Zenthera" className="min-w-0"><PublicContentPanel contentClassName={contentClassName}>{children}</PublicContentPanel></main>
    </div>
  );
}
