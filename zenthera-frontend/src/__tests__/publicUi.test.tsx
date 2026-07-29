import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, expect, it } from 'vitest';
import { PublicLayout } from '@/components/public/PublicLayout';
import { Button } from '@/components/ui/Button';
import { FormAlert } from '@/components/ui/FormAlert';
import { FormField } from '@/components/ui/FormField';
import { PasswordField } from '@/components/ui/PasswordField';
import { PublicSecurityNotice } from '@/components/public/PublicSecurityNotice';

describe('PUBLIC-UI foundation', () => {
  it('renders public landmarks, branding and route content', () => {
    render(<PublicLayout><div>Contenido de acceso</div></PublicLayout>);

    expect(screen.getByRole('complementary', { name: 'Información de Zenthera' })).toBeInTheDocument();
    expect(screen.getByRole('main', { name: 'Acceso y registro de Zenthera' })).toBeInTheDocument();
    expect(screen.getByText('ZENTHERA')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'El sistema operativo para organizaciones de salud modernas' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Gestión clínica conectada' })).toBeInTheDocument();
    expect(screen.getByRole('complementary').querySelectorAll('button')).toHaveLength(0);
    expect(screen.getByText('Contenido de acceso')).toBeInTheDocument();
  });

  it('toggles a PasswordField without changing the native input contract', () => {
    render(<PasswordField id="clave" label="Contraseña" toggleLabel="nueva contraseña" autoComplete="new-password" />);

    const input = screen.getByLabelText('Contraseña');
    expect(input).toHaveAttribute('type', 'password');
    expect(input).toHaveAttribute('autocomplete', 'new-password');

    fireEvent.click(screen.getByRole('button', { name: 'Mostrar nueva contraseña' }));
    expect(input).toHaveAttribute('type', 'text');
    expect(screen.getByRole('button', { name: 'Ocultar nueva contraseña' })).toBeInTheDocument();
  });

  it('associates a FormField label and announced error with its input', () => {
    render(
      <FormField id="correo" label="Correo electrónico" helperText="Usa tu correo institucional" error="Correo inválido" required>
        <input type="email" />
      </FormField>,
    );

    const input = screen.getByLabelText('Correo electrónico');
    expect(input).toHaveAttribute('aria-describedby', 'correo-error');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('alert')).toHaveTextContent('Correo inválido');
  });

  it('uses accessible alert roles by notification severity', () => {
    const { rerender } = render(<FormAlert variant="success">Operación completada</FormAlert>);
    expect(screen.getByRole('status')).toHaveTextContent('Operación completada');

    rerender(<FormAlert variant="error">No fue posible continuar</FormAlert>);
    expect(screen.getByRole('alert')).toHaveTextContent('No fue posible continuar');
  });

  it('disables a loading button while preserving its accessible name', () => {
    render(<Button loading>Continuar</Button>);

    const button = screen.getByRole('button', { name: 'Continuar' });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
  });

  it('renders only neutral language in the security notice', () => {
    render(<PublicSecurityNotice />);

    expect(screen.getByText(/Tu sesión y la información transmitida están protegidas/i)).toBeInTheDocument();
    expect(screen.queryByText(/HIPAA|SOC 2|cifrado certificado/i)).not.toBeInTheDocument();
  });
});
