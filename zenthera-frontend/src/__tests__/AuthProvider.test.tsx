import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AuthProvider } from '../components/providers/AuthProvider';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore, UserProfile } from '../store/authStore';
import apiClient from '../lib/axios';

vi.mock('next/navigation', () => ({
  usePathname: vi.fn(),
  useRouter: vi.fn(),
}));

vi.mock('../lib/axios', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

describe('AuthProvider Integration', () => {
  const mockPush = vi.fn();
  const mockUser: UserProfile = {
    id: 1,
    nombres: 'Test',
    apellidos: 'User',
    correo: 'test@test.com',
    rol: 'ADMIN_CLINICA',
    clinicaId: 1,
    clinicaNombre: 'Mi Clinica',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue({ push: mockPush } as unknown as ReturnType<typeof useRouter>);
    useAuthStore.getState().clearAuth();
    vi.mocked(apiClient.post).mockRejectedValue(new Error('No token'));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('redirects an unauthenticated dashboard visit to login', async () => {
    vi.mocked(usePathname).mockReturnValue('/dashboard');

    render(
      <AuthProvider>
        <div data-testid="protected-content">Protected content</div>
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });

  it('redirects an unauthenticated administrative visit to login once', async () => {
    vi.mocked(usePathname).mockReturnValue('/admin/clinicas');

    render(
      <AuthProvider>
        <div data-testid="admin-content">Administrative content</div>
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledTimes(1);
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
    expect(screen.queryByTestId('admin-content')).not.toBeInTheDocument();
  });

  it('keeps an unauthenticated user on login without a redirect loop', async () => {
    vi.mocked(usePathname).mockReturnValue('/login');

    render(
      <AuthProvider>
        <div data-testid="login-content">Login content</div>
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('login-content')).toBeInTheDocument();
    });
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('keeps an unauthenticated user on activate without a redirect loop', async () => {
    vi.mocked(usePathname).mockReturnValue('/activate');

    render(
      <AuthProvider>
        <div data-testid="activate-content">Activate content</div>
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('activate-content')).toBeInTheDocument();
    });
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('keeps an unauthenticated user on registro without a redirect loop', async () => {
    vi.mocked(usePathname).mockReturnValue('/registro');

    render(
      <AuthProvider>
        <div data-testid="registro-content">Registro content</div>
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('registro-content')).toBeInTheDocument();
    });
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('renders protected content for an authenticated dashboard user', async () => {
    vi.mocked(usePathname).mockReturnValue('/dashboard');
    vi.mocked(apiClient.post).mockResolvedValue({ data: { data: { accessToken: 'token' } } });
    vi.mocked(apiClient.get).mockResolvedValue({ data: { data: mockUser } });
    useAuthStore.getState().setAuth('token', mockUser);

    render(
      <AuthProvider>
        <div data-testid="protected-content">Protected content</div>
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('redirects an authenticated login user to dashboard (onboarding complete)', async () => {
    vi.mocked(usePathname).mockReturnValue('/login');
    vi.mocked(apiClient.post).mockResolvedValue({ data: { data: { accessToken: 'token' } } });
    vi.mocked(apiClient.get).mockResolvedValue({ data: { data: mockUser } });
    useAuthStore.getState().setAuth('token', mockUser);

    render(
      <AuthProvider>
        <div data-testid="login-content">Login content</div>
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('keeps an authenticated user on activate', async () => {
    vi.mocked(usePathname).mockReturnValue('/activate');
    vi.mocked(apiClient.post).mockResolvedValue({ data: { data: { accessToken: 'token' } } });
    vi.mocked(apiClient.get).mockResolvedValue({ data: { data: mockUser } });
    useAuthStore.getState().setAuth('token', mockUser);

    render(
      <AuthProvider>
        <div data-testid="activate-content">Activate content</div>
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('activate-content')).toBeInTheDocument();
    });
    expect(mockPush).not.toHaveBeenCalled();
  });
  it('redirects ADMIN_CLINICA with incomplete onboarding to configuracion-inicial', async () => {
    vi.mocked(usePathname).mockReturnValue('/dashboard');
    const incompleteUser = { ...mockUser, onboardingCompletado: false };
    vi.mocked(apiClient.post).mockResolvedValue({ data: { data: { accessToken: 'token' } } });
    vi.mocked(apiClient.get).mockResolvedValue({ data: { data: incompleteUser } });
    useAuthStore.getState().setAuth('token', incompleteUser);

    render(
      <AuthProvider>
        <div data-testid="protected-content">Protected content</div>
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/configuracion-inicial');
    });
  });

  it('keeps ADMIN_CLINICA with incomplete onboarding on configuracion-inicial', async () => {
    vi.mocked(usePathname).mockReturnValue('/configuracion-inicial');
    const incompleteUser = { ...mockUser, onboardingCompletado: false };
    vi.mocked(apiClient.post).mockResolvedValue({ data: { data: { accessToken: 'token' } } });
    vi.mocked(apiClient.get).mockResolvedValue({ data: { data: incompleteUser } });
    useAuthStore.getState().setAuth('token', incompleteUser);

    render(
      <AuthProvider>
        <div data-testid="onboarding-content">Onboarding content</div>
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('onboarding-content')).toBeInTheDocument();
    });
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('redirects ADMIN_CLINICA with complete onboarding from configuracion-inicial to dashboard', async () => {
    vi.mocked(usePathname).mockReturnValue('/configuracion-inicial');
    const completeUser = { ...mockUser, onboardingCompletado: true };
    vi.mocked(apiClient.post).mockResolvedValue({ data: { data: { accessToken: 'token' } } });
    vi.mocked(apiClient.get).mockResolvedValue({ data: { data: completeUser } });
    useAuthStore.getState().setAuth('token', completeUser);

    render(
      <AuthProvider>
        <div data-testid="onboarding-content">Onboarding content</div>
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('does not redirect SUPER_ADMIN without clinica to onboarding', async () => {
    vi.mocked(usePathname).mockReturnValue('/dashboard');
    const superAdmin = { ...mockUser, rol: 'SUPER_ADMIN', onboardingCompletado: null };
    vi.mocked(apiClient.post).mockResolvedValue({ data: { data: { accessToken: 'token' } } });
    vi.mocked(apiClient.get).mockResolvedValue({ data: { data: superAdmin } });
    useAuthStore.getState().setAuth('token', superAdmin);

    render(
      <AuthProvider>
        <div data-testid="protected-content">Protected content</div>
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });
    expect(mockPush).not.toHaveBeenCalled();
  });
});
