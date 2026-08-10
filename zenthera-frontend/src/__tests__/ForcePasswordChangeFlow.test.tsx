import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import React from 'react';
import '@testing-library/jest-dom';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/axios';
import CambiarPasswordPage from '@/app/cambiar-password/page';
import { ForcePasswordChangeGuard } from '@/components/auth/ForcePasswordChangeGuard';

// Mocks
vi.mock('@/lib/axios');
const mockedApi = vi.mocked(api);

const mockPush = vi.fn();
let mockPathname = '/dashboard';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => mockPathname,
}));

describe('ForcePasswordChangeFlow', () => {
    useAuthStore.setState({ usuario: null, isAuthenticated: false });

  it('1-11. Flujo completo de cambio de contraseña para usuario con password temporal', async () => {
    // 1. login MEDICO con temporal (simulado configurando el store directamente para aislar)
    // 2. authStore recibe cambiarPassword=true (setear antes de render)
    useAuthStore.setState({
      usuario: { id: 1, nombres: 'Test', apellidos: 'User', correo: 'test@test.com', rol: 'MEDICO', clinicaId: 1, cambiarPassword: true, clinicaNombre: 'Clinica Test', onboardingCompletado: true },
      isAuthenticated: true,
    });

    // 3. intento /dashboard redirige /cambiar-password
    render(
      <ForcePasswordChangeGuard>
        <div>Contenido Protegido</div>
      </ForcePasswordChangeGuard>
    );

    // Should not render children and should redirect
    expect(screen.queryByText('Contenido Protegido')).not.toBeInTheDocument();
    expect(mockPush).toHaveBeenCalledWith('/cambiar-password');

    // Limpiar mocks para siguiente paso
    mockPush.mockClear();
    cleanup(); // Clean up previous render

    // Cambiar mock de usePathname para que estemos en '/cambiar-password'
    mockPathname = '/cambiar-password';

    // 5. página /cambiar-password existe y se renderiza
    render(<CambiarPasswordPage />);
    expect(screen.getByText('Cambiar Contraseña')).toBeInTheDocument();

    // 6. nueva password + confirmación
    const passwordInput = screen.getByLabelText('Nueva Contraseña');
    const confirmInput = screen.getByLabelText('Confirmar Contraseña');
    const submitBtn = screen.getByRole('button', { name: /Guardar y Continuar/i });

    fireEvent.change(passwordInput, { target: { value: 'password123456' } });
    fireEvent.change(confirmInput, { target: { value: 'password123456' } });

    mockedApi.post.mockResolvedValueOnce({ data: { success: true } });

    // 7. endpoint exacto
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockedApi.post).toHaveBeenCalledWith('/api/v1/auth/cambiar-password', {
        password: 'password123456'
      });
    });

    // 8. éxito actualiza cambiarPassword=false;
    // 9. después puede entrar a dashboard;
    expect(useAuthStore.getState().usuario?.cambiarPassword).toBe(false);
    expect(mockPush).toHaveBeenCalledWith('/dashboard');

    // Limpiar y volver a renderizar guard estando en /dashboard
    cleanup();
    mockPathname = '/dashboard';
    mockPush.mockClear();

    render(
      <ForcePasswordChangeGuard>
        <div>Contenido Protegido</div>
      </ForcePasswordChangeGuard>
    );

    // 10. no redirect loop
    // Al estar en false, ya no redirige
    expect(mockPush).not.toHaveBeenCalled();
    // Y muestra el contenido protegido
    expect(screen.getByText('Contenido Protegido')).toBeInTheDocument();
  });

  it('11. usuario normal cambiarPassword=false no es afectado', async () => {
    mockPathname = '/dashboard';
    
    useAuthStore.setState({
      usuario: { id: 2, nombres: 'Test', apellidos: 'Admin', correo: 'admin@test.com', rol: 'ADMIN_CLINICA', clinicaId: 1, cambiarPassword: false, clinicaNombre: 'Clinica Test', onboardingCompletado: true },
      isAuthenticated: true,
    });

    render(
      <ForcePasswordChangeGuard>
        <div>Contenido Protegido</div>
      </ForcePasswordChangeGuard>
    );

    expect(mockPush).not.toHaveBeenCalled();
    expect(screen.getByText('Contenido Protegido')).toBeInTheDocument();
  });
});
