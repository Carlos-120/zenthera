import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MockAdapter from 'axios-mock-adapter';
import apiClient from '@/lib/axios';
import { AuthProvider } from '@/components/providers/AuthProvider';
import LoginPage from '@/app/login/page';
import { useAuthStore } from '@/store/authStore';

const mockPush = vi.fn();
let searchParams = new URLSearchParams();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => searchParams,
  usePathname: () => '/login',
}));

describe('Flujos de autenticaci\u00f3n', () => {
  let mock: MockAdapter;
  let queryClient: QueryClient;

  beforeEach(() => {
    mock = new MockAdapter(apiClient);
    useAuthStore.getState().clearAuth();
    queryClient = new QueryClient({
      defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
    });
    searchParams = new URLSearchParams();
    vi.clearAllMocks();
  });

  afterEach(() => {
    mock.restore();
    queryClient.clear();
  });

  it('AuthProvider debe inicializarse silenciosamente y establecer sesi\u00f3n', async () => {
    mock.onPost('/api/v1/auth/refresh').reply(200, { data: { accessToken: 'token-silencioso' } });
    mock.onGet('/api/v1/auth/me').reply(200, {
      data: { id: 1, nombres: 'Test', clinicaNombre: 'Clinica Test' },
    });

    render(<AuthProvider><div>App Contenido</div></AuthProvider>);

    await waitFor(() => {
      expect(useAuthStore.getState().accessToken).toBe('token-silencioso');
      expect(useAuthStore.getState().usuario?.clinicaNombre).toBe('Clinica Test');
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('Login env\u00eda credenciales, consulta /me y redirige al dashboard', async () => {
    const requestOrder: string[] = [];
    searchParams = new URLSearchParams('registered=1');
    mock.onPost('/api/v1/auth/login').reply(() => {
      requestOrder.push('login');
      return [200, { data: { accessToken: 'token-nuevo' } }];
    });
    mock.onGet('/api/v1/auth/me').reply((config) => {
      requestOrder.push('me');
      expect(config.headers?.Authorization).toBe('Bearer token-nuevo');
      return [200, {
        data: {
          id: 1,
          nombres: 'Test',
          apellidos: 'Usuario',
          correo: 'admin@zenthera.test',
          rol: 'ADMIN_CLINICA',
          clinicaId: 1,
          clinicaNombre: 'Clinica Test',
        },
      }];
    });

    render(
      <QueryClientProvider client={queryClient}>
        <LoginPage />
      </QueryClientProvider>
    );

    fireEvent.change(screen.getByLabelText('Correo Electr\u00f3nico'), {
      target: { value: 'admin@zenthera.test' },
    });
    fireEvent.change(screen.getByLabelText('Contrase\u00f1a'), {
      target: { value: 'PasswordDePrueba123!' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar Sesi\u00f3n' }));

    await waitFor(() => {
      expect(mock.history.post).toHaveLength(1);
      expect(mock.history.get).toHaveLength(1);
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });

    expect(JSON.parse(mock.history.post[0].data)).toEqual({
      correo: 'admin@zenthera.test',
      password: 'PasswordDePrueba123!',
    });
    expect(requestOrder).toEqual(['login', 'me']);
    expect(useAuthStore.getState().usuario?.rol).toBe('ADMIN_CLINICA');
    expect(screen.getByRole('status')).toHaveTextContent(
      'Cl\u00ednica registrada correctamente. Ya puedes iniciar sesi\u00f3n con las credenciales que creaste.'
    );
  });

  it('Login fallido no consulta /me, no redirige y muestra el error controlado', async () => {
    mock.onPost('/api/v1/auth/login').reply(401, { message: 'Credenciales inv\u00e1lidas' });

    render(
      <QueryClientProvider client={queryClient}>
        <LoginPage />
      </QueryClientProvider>
    );

    fireEvent.change(screen.getByLabelText('Correo Electr\u00f3nico'), {
      target: { value: 'admin@zenthera.test' },
    });
    fireEvent.change(screen.getByLabelText('Contrase\u00f1a'), {
      target: { value: 'PasswordDePrueba123!' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar Sesi\u00f3n' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Credenciales incorrectas o acceso denegado.'
    );
    expect(mock.history.get).toHaveLength(0);
    expect(mockPush).not.toHaveBeenCalled();
  });
});
