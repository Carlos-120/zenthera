import { Activity, LockKeyhole, ShieldCheck, Stethoscope } from 'lucide-react';

const benefits = [
  { icon: Stethoscope, title: 'Creado para organizaciones de salud.' },
  { icon: Activity, title: 'Unificado, seguro y escalable.' },
  { icon: ShieldCheck, title: 'Privacidad y control de acceso.' },
];

export function PublicBrandPanel() {
  return (
    <div className="flex h-full flex-col justify-between bg-foreground px-5 py-5 text-white sm:px-8 sm:py-6 lg:px-12 lg:py-12">
      <div>
        <div className="flex items-center gap-3" aria-label="Zenthera">
          <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-accent text-white shadow-[var(--shadow-sm)]"><Activity aria-hidden="true" className="h-6 w-6" /></div>
          <span className="text-xl font-bold tracking-[0.16em]">ZENTHERA</span>
        </div>
        <div className="mt-5 max-w-lg sm:mt-6 lg:mt-14">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-200 lg:text-sm lg:tracking-[0.16em]">Gestión clínica conectada</p>
          <h2 className="mt-2 text-2xl font-semibold leading-tight lg:hidden">Gestión clínica conectada</h2>
          <h2 className="mt-4 hidden text-[clamp(2.25rem,3vw,2.75rem)] font-semibold leading-tight lg:block">El sistema operativo para organizaciones de salud modernas</h2>
          <p className="mt-3 max-w-md text-sm leading-6 text-slate-200 lg:mt-5 lg:text-lg lg:leading-7"><span className="lg:hidden">Centraliza la operación de tu clínica en un solo lugar.</span><span className="hidden lg:inline">Centraliza la operación de tu clínica con herramientas pensadas para equipos de atención.</span></p>
        </div>
        <ul className="mt-8 hidden space-y-4 lg:block" aria-label="Beneficios de Zenthera">
          {benefits.map(({ icon: Icon, title }) => <li key={title} className="flex items-center gap-3 text-sm text-slate-100 sm:text-base"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-teal-200"><Icon aria-hidden="true" className="h-4 w-4" /></span>{title}</li>)}
        </ul>
      </div>
      <div className="pointer-events-none relative mt-10 hidden h-48 overflow-hidden rounded-[var(--radius-lg)] border border-white/10 bg-white/[0.04] lg:block" aria-hidden="true">
        <div className="absolute -right-10 -top-12 h-44 w-44 rounded-full bg-accent/30 blur-3xl" />
        <div className="absolute -bottom-12 -left-8 h-40 w-40 rounded-full bg-primary/40 blur-3xl" />
        <svg viewBox="0 0 420 190" className="absolute inset-0 h-full w-full text-sky-200/40" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M65 125 L155 70 L260 112 L350 55" />
          <path d="M155 70 L220 35 L260 112" />
          <circle cx="65" cy="125" r="5" fill="currentColor" /><circle cx="155" cy="70" r="5" fill="currentColor" /><circle cx="220" cy="35" r="4" fill="currentColor" /><circle cx="260" cy="112" r="5" fill="currentColor" /><circle cx="350" cy="55" r="5" fill="currentColor" />
        </svg>
        <Activity className="absolute left-[11%] top-[42%] h-7 w-7 text-teal-200" />
        <LockKeyhole className="absolute left-[48%] top-[12%] h-7 w-7 text-sky-200" />
        <Stethoscope className="absolute right-[12%] top-[20%] h-7 w-7 text-white/90" />
      </div>
    </div>
  );
}
