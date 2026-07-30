import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { EstadoModal } from '../components/clinica/EstadoModal';
import { ClinicaResponse } from '@/lib/api/clinicas';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockClinicaActiva: ClinicaResponse = {
  id: 1,
  ruc: '1234567890001',
  razonSocial: 'Clinica Test',
  nombre: 'Clinica T',
  correo: 'test@clinica.com',
  telefono: '12345678',
  direccion: 'Calle 1',
  ciudad: 'Ciudad',
  provincia: 'Provincia',
  pais: 'Pais',
  zonaHoraria: 'UTC',
  logo: null,
  activa: true
};

const mockClinicaInactiva: ClinicaResponse = {
  ...mockClinicaActiva,
  activa: false
};

describe('EstadoModal', () => {
  const mockOnClose = vi.fn();
  const mockOnConfirm = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('no renderiza cuando isOpen es false', () => {
    render(
      <EstadoModal
        isOpen={false}
        onClose={mockOnClose}
        clinica={mockClinicaActiva}
        onConfirm={mockOnConfirm}
        isPending={false}
      />
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renderiza correctamente para suspender clínica activa', () => {
    render(
      <EstadoModal
        isOpen={true}
        onClose={mockOnClose}
        clinica={mockClinicaActiva}
        onConfirm={mockOnConfirm}
        isPending={false}
      />
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Suspender Clínica')).toBeInTheDocument();
    expect(screen.getByText(/¿Está seguro que desea/)).toBeInTheDocument();
    expect(screen.getByText('suspender')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Confirmar Suspensión' })).toBeInTheDocument();
    expect(screen.getByText(/todos los usuarios asociados perderán el acceso/)).toBeInTheDocument();
  });

  it('renderiza correctamente para reactivar clínica inactiva', () => {
    render(
      <EstadoModal
        isOpen={true}
        onClose={mockOnClose}
        clinica={mockClinicaInactiva}
        onConfirm={mockOnConfirm}
        isPending={false}
      />
    );

    expect(screen.getByText('Reactivar Clínica')).toBeInTheDocument();
    expect(screen.getByText('reactivar')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Confirmar Reactivación' })).toBeInTheDocument();
    expect(screen.queryByText(/todos los usuarios asociados perderán el acceso/)).not.toBeInTheDocument();
  });

  it('exige motivo y muestra error local si se intenta enviar vacío', () => {
    render(
      <EstadoModal
        isOpen={true}
        onClose={mockOnClose}
        clinica={mockClinicaActiva}
        onConfirm={mockOnConfirm}
        isPending={false}
      />
    );

    const confirmBtn = screen.getByRole('button', { name: 'Confirmar Suspensión' });
    fireEvent.click(confirmBtn);

    expect(screen.getByText('Debe proporcionar un motivo para este cambio de estado.')).toBeInTheDocument();
    expect(mockOnConfirm).not.toHaveBeenCalled();
  });

  it('envía el formulario cuando el motivo es válido', () => {
    render(
      <EstadoModal
        isOpen={true}
        onClose={mockOnClose}
        clinica={mockClinicaActiva}
        onConfirm={mockOnConfirm}
        isPending={false}
      />
    );

    const textarea = screen.getByPlaceholderText(/Escriba el motivo/);
    fireEvent.change(textarea, { target: { value: 'Motivo de prueba' } });

    const confirmBtn = screen.getByRole('button', { name: 'Confirmar Suspensión' });
    fireEvent.click(confirmBtn);

    expect(screen.queryByText('Debe proporcionar un motivo para este cambio de estado.')).not.toBeInTheDocument();
    expect(mockOnConfirm).toHaveBeenCalledWith('Motivo de prueba');
  });

  it('muestra el error externo dentro del modal', () => {
    render(
      <EstadoModal
        isOpen={true}
        onClose={mockOnClose}
        clinica={mockClinicaActiva}
        onConfirm={mockOnConfirm}
        isPending={false}
        externalError="Error desde el backend"
      />
    );

    expect(screen.getByText('Error desde el backend')).toBeInTheDocument();
  });

  it('cierra el modal al presionar Escape si no está pending', () => {
    render(
      <EstadoModal
        isOpen={true}
        onClose={mockOnClose}
        clinica={mockClinicaActiva}
        onConfirm={mockOnConfirm}
        isPending={false}
      />
    );

    fireEvent.keyDown(window, { key: 'Escape', code: 'Escape' });
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('NO cierra el modal al presionar Escape si está pending', () => {
    render(
      <EstadoModal
        isOpen={true}
        onClose={mockOnClose}
        clinica={mockClinicaActiva}
        onConfirm={mockOnConfirm}
        isPending={true}
      />
    );

    fireEvent.keyDown(window, { key: 'Escape', code: 'Escape' });
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('deshabilita los controles mientras isPending es true', () => {
    render(
      <EstadoModal
        isOpen={true}
        onClose={mockOnClose}
        clinica={mockClinicaActiva}
        onConfirm={mockOnConfirm}
        isPending={true}
      />
    );

    expect(screen.getByPlaceholderText(/Escriba el motivo/)).toBeDisabled();
    expect(screen.getByRole('button', { name: /Confirmar/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cerrar modal' })).toBeDisabled();
  });

  it('restaura el foco al elemento anterior cuando se desmonta', () => {
    const button = document.createElement('button');
    document.body.appendChild(button);
    button.focus();

    const { unmount } = render(
      <EstadoModal
        isOpen={true}
        onClose={mockOnClose}
        clinica={mockClinicaActiva}
        onConfirm={mockOnConfirm}
        isPending={false}
      />
    );

    // Al desmontarse, debe restaurar el foco al botón
    unmount();
    expect(document.activeElement).toBe(button);

    document.body.removeChild(button);
  });
});
