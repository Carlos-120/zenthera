'use client';

import { forwardRef, useState, type InputHTMLAttributes } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export interface PasswordFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
  toggleLabel?: string;
}

export const PasswordField = forwardRef<HTMLInputElement, PasswordFieldProps>(function PasswordField({ className = '', disabled, label, toggleLabel, ...props }, ref) {
  const [visible, setVisible] = useState(false);
  const inputId = props.id ?? props.name;
  const accessibleToggleLabel = toggleLabel ?? label.toLocaleLowerCase('es');
  return (
    <div>
      <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-foreground">{label}</label>
      <div className="relative">
        <input {...props} ref={ref} id={inputId} type={visible ? 'text' : 'password'} disabled={disabled} className={`w-full rounded-[var(--radius-md)] border border-border bg-surface px-4 py-2.5 pr-12 text-foreground transition-colors placeholder:text-foreground-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-focus-ring disabled:cursor-not-allowed disabled:opacity-70 ${className}`} />
        <button type="button" disabled={disabled} onClick={() => setVisible((current) => !current)} aria-label={visible ? `Ocultar ${accessibleToggleLabel}` : `Mostrar ${accessibleToggleLabel}`} className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-foreground-muted hover:text-foreground disabled:cursor-not-allowed">
          {visible ? <EyeOff aria-hidden="true" className="h-5 w-5" /> : <Eye aria-hidden="true" className="h-5 w-5" />}
        </button>
      </div>
    </div>
  );
});
