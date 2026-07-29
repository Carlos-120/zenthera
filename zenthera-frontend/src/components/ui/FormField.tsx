import { cloneElement, type ReactElement, type ReactNode } from 'react';

type FieldChildProps = { id?: string; required?: boolean; 'aria-describedby'?: string; 'aria-invalid'?: boolean };

export interface FormFieldProps {
  id: string;
  label: ReactNode;
  children: ReactElement<FieldChildProps>;
  helperText?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  className?: string;
}

export function FormField({ children, className = '', error, helperText, id, label, required = false }: FormFieldProps) {
  const helperId = helperText && !error ? `${id}-helper` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [helperId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={className}>
      <label htmlFor={id} className={`mb-1.5 block text-sm font-medium text-foreground ${required ? "after:ml-1 after:text-danger after:content-['*']" : ''}`}>{label}</label>
      {cloneElement(children, { id, required: children.props.required ?? required, 'aria-describedby': describedBy, 'aria-invalid': error ? true : undefined })}
      {helperText && !error && <p id={helperId} className="mt-1.5 text-sm text-foreground-muted">{helperText}</p>}
      {error && <p id={errorId} role="alert" className="mt-1.5 text-sm text-danger">{error}</p>}
    </div>
  );
}
