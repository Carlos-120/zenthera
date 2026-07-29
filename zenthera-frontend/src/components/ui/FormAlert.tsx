import type { ReactNode } from 'react';
import { AlertCircle, CheckCircle2, Info, TriangleAlert } from 'lucide-react';

type AlertVariant = 'info' | 'success' | 'warning' | 'error';
export interface FormAlertProps { children: ReactNode; variant?: AlertVariant; className?: string; }
const styles: Record<AlertVariant, { className: string; Icon: typeof Info; role: 'alert' | 'status' }> = {
  info: { className: 'border-primary/20 bg-primary/10 text-foreground', Icon: Info, role: 'status' },
  success: { className: 'border-success/20 bg-success/10 text-success', Icon: CheckCircle2, role: 'status' },
  warning: { className: 'border-warning/20 bg-warning/10 text-warning', Icon: TriangleAlert, role: 'alert' },
  error: { className: 'border-danger/20 bg-danger/10 text-danger', Icon: AlertCircle, role: 'alert' },
};
export function FormAlert({ children, className = '', variant = 'info' }: FormAlertProps) {
  const { className: variantClassName, Icon, role } = styles[variant];
  return <div role={role} className={`flex items-start gap-3 rounded-[var(--radius-md)] border p-4 text-sm ${variantClassName} ${className}`}><Icon aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" /><div>{children}</div></div>;
}
