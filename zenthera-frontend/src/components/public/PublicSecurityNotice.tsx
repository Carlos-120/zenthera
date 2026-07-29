import { LockKeyhole } from 'lucide-react';

export function PublicSecurityNotice() {
  return <p className="mx-auto mt-5 flex max-w-lg items-start justify-center gap-2 text-center text-sm leading-6 text-foreground-muted sm:mt-6"><LockKeyhole aria-hidden="true" className="mt-1 h-4 w-4 shrink-0 text-accent" /><span>Tu sesión y la información transmitida están protegidas mediante controles de acceso y prácticas de seguridad del sistema.</span></p>;
}
