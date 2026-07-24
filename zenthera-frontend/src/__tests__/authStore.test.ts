import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore, UserProfile } from '@/store/authStore';

describe('authStore', () => {
  beforeEach(() => {
    useAuthStore.getState().clearAuth();
  });

  it('debe inicializarse con el estado vacío y sin autenticar', () => {
    const state = useAuthStore.getState();
    expect(state.accessToken).toBeNull();
    expect(state.usuario).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  it('debe establecer el estado de autenticación y usuario', () => {
    const testUser: UserProfile = {
      id: 1,
      nombres: 'Juan',
      apellidos: 'Pérez',
      correo: 'juan@test.com',
      rol: 'ROLE_MEDICO',
      clinicaId: 10,
      clinicaNombre: 'Clínica Central'
    };

    useAuthStore.getState().setAuth('test-token', testUser);
    const state = useAuthStore.getState();

    expect(state.accessToken).toBe('test-token');
    expect(state.usuario).toEqual(testUser);
    expect(state.isAuthenticated).toBe(true);
  });

  it('debe limpiar el estado cuando se cierra sesión', () => {
    useAuthStore.getState().setAuth('test-token', {
      id: 1, nombres: 'A', apellidos: 'B', correo: 'a@b.com', rol: 'ADMIN', clinicaId: 1, clinicaNombre: 'Test'
    });

    useAuthStore.getState().clearAuth();
    const state = useAuthStore.getState();

    expect(state.accessToken).toBeNull();
    expect(state.usuario).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });
});
