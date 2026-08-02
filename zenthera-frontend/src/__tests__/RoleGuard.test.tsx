import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { RoleGuard } from '../components/auth/RoleGuard';
import { useRouter } from 'next/navigation';
import { useAuthStore, UserProfile } from '../store/authStore';

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

describe('RoleGuard', () => {
  const mockPush = vi.fn();
  const mockReplace = vi.fn();

  const mockAdminClinica: UserProfile = {
    id: 1,
    nombres: 'Test',
    apellidos: 'User',
    correo: 'test@test.com',
    rol: 'ADMIN_CLINICA',
    clinicaId: 1,
    clinicaNombre: 'Mi Clinica', onboardingCompletado: true
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue({
      push: mockPush,
      replace: mockReplace
    } as unknown as ReturnType<typeof useRouter>);
    useAuthStore.getState().clearAuth();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('debe renderizar el contenido si el rol está autorizado', () => {
    useAuthStore.getState().setAuth('token', mockAdminClinica);

    render(
      <RoleGuard allowedRoles={['ADMIN_CLINICA', 'SUPER_ADMIN']}>
        <div data-testid="protected-content">Contenido Permitido</div>
      </RoleGuard>
    );

    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('debe redirigir al dashboard y no renderizar si el rol es rechazado', async () => {
    useAuthStore.getState().setAuth('token', mockAdminClinica);

    render(
      <RoleGuard allowedRoles={['SUPER_ADMIN']}>
        <div data-testid="protected-content">Contenido Restringido</div>
      </RoleGuard>
    );

    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('no debe renderizar nada si no hay sesión (lo manejará AuthProvider)', () => {
    render(
      <RoleGuard allowedRoles={['SUPER_ADMIN']}>
        <div data-testid="protected-content">Contenido Restringido</div>
      </RoleGuard>
    );

    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    // En este escenario el usuario es null por lo que solo retorna null y no hace replace
    // porque el AuthProvider principal se encarga del redireccionamiento general.
    expect(mockReplace).not.toHaveBeenCalled();
  });
});
