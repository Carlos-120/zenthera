import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore, UserProfile } from '../store/authStore';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import apiClient from '../lib/axios';

vi.mock('next/navigation', () => ({
  usePathname: vi.fn(),
  useRouter: vi.fn(),
}));

vi.mock('../lib/axios', () => ({
  default: {
    post: vi.fn(),
  }
}));

const mockQueryClient = new QueryClient();

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <QueryClientProvider client={mockQueryClient}>
      {ui}
    </QueryClientProvider>
  );
};

describe('DashboardLayout', () => {
  const mockPush = vi.fn();

  const mockAdminClinica: UserProfile = {
    id: 1,
    nombres: 'Test',
    apellidos: 'User',
    correo: 'test@test.com',
    rol: 'ADMIN_CLINICA',
    clinicaId: 1,
    clinicaNombre: 'Mi Clinica', onboardingCompletado: true
  };

  const mockSuperAdmin: UserProfile = {
    id: 2,
    nombres: 'Super',
    apellidos: 'Admin',
    correo: 'super@test.com',
    rol: 'SUPER_ADMIN',
    clinicaId: 0,
    clinicaNombre: 'Sistema', onboardingCompletado: true
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue({ push: mockPush } as unknown as ReturnType<typeof useRouter>);
    vi.mocked(usePathname).mockReturnValue('/dashboard');
    useAuthStore.getState().clearAuth();
    mockQueryClient.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('debe mostrar el menú correcto para ADMIN_CLINICA', () => {
    useAuthStore.getState().setAuth('token', mockAdminClinica);
    renderWithProviders(<DashboardLayout><div>Test</div></DashboardLayout>);

    expect(screen.getByText('Mi Clínica')).toBeInTheDocument();
    expect(screen.getByText('Inicio')).toBeInTheDocument();
    expect(screen.queryByText('Gestión de Clínicas')).not.toBeInTheDocument();
  });

  it('debe mostrar el menú correcto para SUPER_ADMIN', () => {
    useAuthStore.getState().setAuth('token', mockSuperAdmin);
    renderWithProviders(<DashboardLayout><div>Test</div></DashboardLayout>);

    expect(screen.queryByText('Mi Clínica')).not.toBeInTheDocument();
    expect(screen.getByText('Inicio')).toBeInTheDocument();
    expect(screen.getByText('Gestión de Clínicas')).toBeInTheDocument();
  });

  it('debe limpiar Query Cache y AuthStore en logout exitoso', async () => {
    useAuthStore.getState().setAuth('token', mockAdminClinica);
    vi.mocked(apiClient.post).mockResolvedValue({ data: {} });

    // Setear algo falso en la caché para probar que se limpia
    mockQueryClient.setQueryData(['test-query'], { foo: 'bar' });

    renderWithProviders(<DashboardLayout><div>Test</div></DashboardLayout>);

    const logoutButtons = screen.getAllByRole('button').filter(b => b.textContent?.includes('Cerrar Sesión') || b.querySelector('.lucide-log-out'));
    fireEvent.click(logoutButtons[0]);

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith('/api/v1/auth/logout');
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login');
    });

    expect(mockQueryClient.getQueryData(['test-query'])).toBeUndefined();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it('debe limpiar Query Cache y AuthStore incluso si el logout falla', async () => {
    useAuthStore.getState().setAuth('token', mockAdminClinica);
    vi.mocked(apiClient.post).mockRejectedValue(new Error('Network error'));

    mockQueryClient.setQueryData(['test-query'], { foo: 'bar' });

    renderWithProviders(<DashboardLayout><div>Test</div></DashboardLayout>);

    const logoutButtons = screen.getAllByRole('button').filter(b => b.textContent?.includes('Cerrar Sesión') || b.querySelector('.lucide-log-out'));
    fireEvent.click(logoutButtons[0]);

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith('/api/v1/auth/logout');
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login');
    });

    expect(mockQueryClient.getQueryData(['test-query'])).toBeUndefined();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it('debe abrir la navegación móvil al hacer clic en el botón de hamburguesa', async () => {
    useAuthStore.getState().setAuth('token', mockAdminClinica);
    renderWithProviders(<DashboardLayout><div>Test</div></DashboardLayout>);

    // Primero, en móvil, debería haber dos botones de logout (uno desktop y uno mobile)
    // El menú móvil está oculto por defecto
    const menuButtons = screen.getAllByRole('button').filter(b => b.querySelector('.lucide-menu'));
    expect(menuButtons.length).toBeGreaterThan(0);

    // Identificar el link 'Mi Clínica' y 'Inicio' (1 de cada uno normalmente en desktop, pero al abrir móvil aparecen más)
    // Al principio, sólo están los del aside (que tienen clase hidden md:flex)
    // La prueba real RTL no procesa CSS `hidden`, por lo que verá los links del aside.
    // Al abrir el modal, se añaden los links en el modal.
    const initialLinksCount = screen.getAllByText('Mi Clínica').length;

    fireEvent.click(menuButtons[0]);

    await waitFor(() => {
      expect(screen.getAllByText('Mi Clínica').length).toBeGreaterThan(initialLinksCount);
    });
  });
});
