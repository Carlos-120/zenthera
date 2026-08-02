import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import apiClient from '@/lib/axios';
import { useAuthStore } from '@/store/authStore';

describe('Axios Interceptors', () => {
  let mockApi: MockAdapter;
  let mockGlobal: MockAdapter;

  beforeEach(() => {
    mockApi = new MockAdapter(apiClient);
    mockGlobal = new MockAdapter(axios);
    useAuthStore.getState().clearAuth();
  });

  afterEach(() => {
    mockApi.restore();
    mockGlobal.restore();
  });

  it('debe agregar el token de autorización si existe en el estado', async () => {
    const testUser = {
      id: 1, nombres: 'A', apellidos: 'B', correo: 'a@b.com', rol: 'ADMIN', clinicaId: 1, clinicaNombre: 'Test', onboardingCompletado: true
    };
    useAuthStore.getState().setAuth('token123', testUser);

    mockApi.onGet('/test').reply((config) => {
      expect(config.headers?.Authorization).toBe('Bearer token123');
      return [200, { success: true }];
    });

    const response = await apiClient.get('/test');
    expect(response.status).toBe(200);
  });

  it('debe intentar refrescar el token si recibe 401 y actualizar los headers', async () => {
    // 1. Falla inicial con 401
    mockApi.onGet('/test-refresh').replyOnce(401);

    // 2. Mock del endpoint de refresh (usa axios global internamente con baseURL completa)
    mockGlobal.onPost('http://localhost:8080/api/v1/auth/refresh').reply(200, {
      data: { accessToken: 'new-token-456' }
    });

    // 3. Reintento exitoso
    mockApi.onGet('/test-refresh').reply((config) => {
      expect(config.headers?.Authorization).toBe('Bearer new-token-456');
      return [200, { success: true }];
    });

    const response = await apiClient.get('/test-refresh');

    // Verificar que el reintento funcionó y actualizó la memoria
    expect(response.status).toBe(200);
    expect(useAuthStore.getState().accessToken).toBe('new-token-456');
  });

  it('no debe entrar en loop si la peticion original es de login', async () => {
    mockApi.onPost('/api/v1/auth/login').reply(401);

    await expect(apiClient.post('/api/v1/auth/login')).rejects.toThrow();
    // Validamos que el refresh endpoint nunca fue llamado (history de axios-mock-adapter)
    const refreshCalls = mockGlobal.history.post.filter(req => req.url === 'http://localhost:8080/api/v1/auth/refresh');
    expect(refreshCalls.length).toBe(0);
  });
});
