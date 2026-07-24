import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ActivationForm from '../components/auth/ActivationForm';
import { activateAccount } from '../lib/api/auth';
import { useSearchParams, useRouter } from 'next/navigation';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useSearchParams: vi.fn(),
  useRouter: vi.fn(),
}));

// Mock API
vi.mock('../lib/api/auth', () => ({
  activateAccount: vi.fn(),
}));

describe('ActivationForm', () => {
  const mockPush = vi.fn();
  let searchParamsMock: URLSearchParams;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue({ push: mockPush } as unknown as ReturnType<typeof useRouter>);
    searchParamsMock = new URLSearchParams();
    vi.mocked(useSearchParams).mockReturnValue(searchParamsMock as unknown as ReturnType<typeof useSearchParams>);

    // Configurar window.location y history para pruebas de replaceState
    Object.defineProperty(window, 'location', {
      value: new URL('http://localhost:3000/activate?token=valid-token'),
      writable: true,
    });
    vi.spyOn(window.history, 'replaceState');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('debe mostrar error si el token está ausente', () => {
    Object.defineProperty(window, 'location', {
      value: new URL('http://localhost:3000/activate'),
      writable: true,
    });
    // searchParamsMock está vacío
    render(<ActivationForm />);
    expect(screen.getByText('Enlace de activación inválido o faltante')).toBeInTheDocument();
  });

  it('debe limpiar el token de la URL usando history.replaceState', () => {
    searchParamsMock.set('token', 'valid-token');
    render(<ActivationForm />);

    expect(window.history.replaceState).toHaveBeenCalledWith(
      {},
      '',
      'http://localhost:3000/activate'
    );
  });

  it('debe mostrar error si las contraseñas son menores a 12 caracteres', () => {
    searchParamsMock.set('token', 'valid-token');
    render(<ActivationForm />);

    const passwordInputs = screen.getAllByPlaceholderText('Mínimo 12 caracteres');
    fireEvent.change(passwordInputs[0], { target: { value: 'short123' } });
    fireEvent.change(passwordInputs[1], { target: { value: 'short123' } });

    fireEvent.click(screen.getByRole('button', { name: 'Activar Cuenta' }));

    expect(screen.getByText('La contraseña debe tener al menos 12 caracteres')).toBeInTheDocument();
    expect(activateAccount).not.toHaveBeenCalled();
  });

  it('debe mostrar error si las contraseñas no coinciden', () => {
    searchParamsMock.set('token', 'valid-token');
    render(<ActivationForm />);

    const passwordInputs = screen.getAllByPlaceholderText('Mínimo 12 caracteres');
    fireEvent.change(passwordInputs[0], { target: { value: 'ValidPassword123!' } });
    fireEvent.change(passwordInputs[1], { target: { value: 'DifferentPassword123!' } });

    fireEvent.click(screen.getByRole('button', { name: 'Activar Cuenta' }));

    expect(screen.getByText('Las contraseñas no coinciden')).toBeInTheDocument();
    expect(activateAccount).not.toHaveBeenCalled();
  });

  it('debe procesar activación exitosa y redirigir a /login', async () => {
    searchParamsMock.set('token', 'valid-token');
    vi.mocked(activateAccount).mockResolvedValue({ success: true, message: 'OK' });

    render(<ActivationForm />);

    const passwordInputs = screen.getAllByPlaceholderText('Mínimo 12 caracteres');
    fireEvent.change(passwordInputs[0], { target: { value: 'ValidPassword123!' } });
    fireEvent.change(passwordInputs[1], { target: { value: 'ValidPassword123!' } });

    fireEvent.click(screen.getByRole('button', { name: 'Activar Cuenta' }));

    await waitFor(() => {
      expect(screen.getByText('¡Cuenta Activada!')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login');
    }, { timeout: 4000 });
  });

  it('debe manejar error genérico (token inválido o vencido)', async () => {
    searchParamsMock.set('token', 'invalid-token');
    vi.mocked(activateAccount).mockRejectedValue({
      response: { status: 400, data: { message: 'El token de activación es inválido o ha expirado' } }
    });

    render(<ActivationForm />);

    const passwordInputs = screen.getAllByPlaceholderText('Mínimo 12 caracteres');
    fireEvent.change(passwordInputs[0], { target: { value: 'ValidPassword123!' } });
    fireEvent.change(passwordInputs[1], { target: { value: 'ValidPassword123!' } });

    fireEvent.click(screen.getByRole('button', { name: 'Activar Cuenta' }));

    await waitFor(() => {
      expect(screen.getByText('El token de activación es inválido o ha expirado')).toBeInTheDocument();
    });
  });

  it('debe manejar error 429 Too Many Requests', async () => {
    searchParamsMock.set('token', 'valid-token');
    vi.mocked(activateAccount).mockRejectedValue({
      response: { status: 429 }
    });

    render(<ActivationForm />);

    const passwordInputs = screen.getAllByPlaceholderText('Mínimo 12 caracteres');
    fireEvent.change(passwordInputs[0], { target: { value: 'ValidPassword123!' } });
    fireEvent.change(passwordInputs[1], { target: { value: 'ValidPassword123!' } });

    fireEvent.click(screen.getByRole('button', { name: 'Activar Cuenta' }));

    await waitFor(() => {
      expect(screen.getByText('Demasiados intentos. Por favor intente más tarde.')).toBeInTheDocument();
    });
  });

  it('debe manejar error 503 con Retry-After', async () => {
    searchParamsMock.set('token', 'valid-token');
    vi.mocked(activateAccount).mockRejectedValue({
      response: {
        status: 503,
        headers: { 'retry-after': '10' }
      }
    });

    render(<ActivationForm />);

    const passwordInputs = screen.getAllByPlaceholderText('Mínimo 12 caracteres');
    fireEvent.change(passwordInputs[0], { target: { value: 'ValidPassword123!' } });
    fireEvent.change(passwordInputs[1], { target: { value: 'ValidPassword123!' } });

    fireEvent.click(screen.getByRole('button', { name: 'Activar Cuenta' }));

    await waitFor(() => {
      expect(screen.getByText('El servicio está ocupado. Por favor, intente de nuevo en 10 segundos.')).toBeInTheDocument();
    });
  });
});
