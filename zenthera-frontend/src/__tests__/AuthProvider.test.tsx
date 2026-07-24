import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AuthProvider } from '../components/providers/AuthProvider';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore, UserProfile } from '../store/authStore';
import apiClient from '../lib/axios';

// Mock Next.js hooks
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(),
  useRouter: vi.fn(),
}));

// Mock API Client to avoid real requests during auth init
vi.mock('../lib/axios', () => {
  return {
    default: {
      post: vi.fn(),
      get: vi.fn(),
    }
  };
});

describe('AuthProvider Integration', () => {
  const mockPush = vi.fn();

  const mockUser: UserProfile = {
    id: 1,
    nombres: 'Test',
    apellidos: 'User',
    correo: 'test@test.com',
    rol: 'ADMIN_CLINICA',
    clinicaId: 1,
    clinicaNombre: 'Mi Clinica'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue({ push: mockPush } as unknown as ReturnType<typeof useRouter>);

    // Clear Zustand store
    useAuthStore.getState().clearAuth();

    // Default API mock to fail (so it defaults to unauthenticated if clearAuth is called)
    vi.mocked(apiClient.post).mockRejectedValue(new Error('No token'));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('debe redirigir a /login si no hay sesión y la ruta es protegida', async () => {
    vi.mocked(usePathname).mockReturnValue('/dashboard');

    render(
      <AuthProvider>
        <div data-testid="protected-content">Contenido Protegido</div>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
    // Renderiza null mientras redirige
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });

  it('debe renderizar contenido protegido si hay sesión y la ruta es protegida', async () => {
    vi.mocked(usePathname).mockReturnValue('/dashboard');
    vi.mocked(apiClient.post).mockResolvedValue({ data: { data: { accessToken: 'token' } } });
    vi.mocked(apiClient.get).mockResolvedValue({ data: { data: { id: 1, correo: 'test@test.com' } } });

    // Simular que ya está autenticado en memoria
    useAuthStore.getState().setAuth('token', mockUser);

    render(
      <AuthProvider>
        <div data-testid="protected-content">Contenido Protegido</div>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('debe renderizar /login si no hay sesión (GUEST_ONLY_ROUTES)', async () => {
    vi.mocked(usePathname).mockReturnValue('/login');

    render(
      <AuthProvider>
        <div data-testid="login-content">Contenido Login</div>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('login-content')).toBeInTheDocument();
    });
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('debe redirigir a /dashboard si hay sesión y trata de acceder a /login', async () => {
    vi.mocked(usePathname).mockReturnValue('/login');
    vi.mocked(apiClient.post).mockResolvedValue({ data: { data: { accessToken: 'token' } } });
    vi.mocked(apiClient.get).mockResolvedValue({ data: { data: mockUser } });

    useAuthStore.getState().setAuth('token', mockUser);

    render(
      <AuthProvider>
        <div data-testid="login-content">Contenido Login</div>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('debe renderizar /activate sin importar si hay o no sesión (PUBLIC_ROUTES)', async () => {
    vi.mocked(usePathname).mockReturnValue('/activate');

    // Escenario 1: Sin sesión
    const { unmount } = render(
      <AuthProvider>
        <div data-testid="activate-content">Contenido Activate</div>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('activate-content')).toBeInTheDocument();
    });
    expect(mockPush).not.toHaveBeenCalled();

    unmount();

    // Escenario 2: Con sesión
    vi.mocked(apiClient.post).mockResolvedValue({ data: { data: { accessToken: 'token' } } });
    vi.mocked(apiClient.get).mockResolvedValue({ data: { data: mockUser } });
    useAuthStore.getState().setAuth('token', mockUser);

    render(
      <AuthProvider>
        <div data-testid="activate-content-2">Contenido Activate 2</div>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('activate-content-2')).toBeInTheDocument();
    });
    // No debe haber redirigido a /dashboard a pesar de tener sesión
    expect(mockPush).not.toHaveBeenCalled();
  });
});
