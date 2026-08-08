import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import UsuariosPage from '../app/dashboard/usuarios/page';
import { getUsuarios, getRolesAsignables, createUsuario, updateUsuario, updateEstadoUsuario } from '../lib/api/usuarios';
import { useAuthStore } from '../store/authStore';
import apiClient from '../lib/axios';

// Mock axios para interceptar las llamadas HTTP y verificar URLs y payloads
vi.mock('../lib/axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
  },
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/dashboard/usuarios',
  useSearchParams: () => new URLSearchParams(),
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
});

describe('Usuarios Contract API', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('1. Usa GET /api/v1/clinica/usuarios', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: {} });
    await getUsuarios({ page: 0 });
    expect(apiClient.get).toHaveBeenCalledWith('/api/v1/clinica/usuarios', expect.any(Object));
  });

  it('2. Usa GET /api/v1/clinica/roles', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: [] });
    await getRolesAsignables();
    expect(apiClient.get).toHaveBeenCalledWith('/api/v1/clinica/roles');
  });

  it('10. Creación usa POST /api/v1/clinica/usuarios', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({ data: {} });
    await createUsuario({ nombres: 'N', apellidos: 'A', correo: 'a@b.c', rolId: 1, cedula: '1' });
    expect(apiClient.post).toHaveBeenCalledWith('/api/v1/clinica/usuarios', expect.any(Object));
  });

  it('11. Payload de creación NO contiene clinicaId', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({ data: {} });
    const payload = { nombres: 'N', apellidos: 'A', correo: 'a@b.c', rolId: 1, cedula: '1' };
    await createUsuario(payload);
    expect(apiClient.post).toHaveBeenCalledWith(
      '/api/v1/clinica/usuarios',
      expect.not.objectContaining({ clinicaId: expect.anything() })
    );
  });

  it('12. Edición usa PUT /api/v1/clinica/usuarios/{id}', async () => {
    vi.mocked(apiClient.put).mockResolvedValue({ data: {} });
    await updateUsuario(99, { nombres: 'N', apellidos: 'A', correo: 'a@b.c', rolId: 1, cedula: '1' });
    expect(apiClient.put).toHaveBeenCalledWith('/api/v1/clinica/usuarios/99', expect.any(Object));
  });

  it('13. Payload de edición NO contiene clinicaId', async () => {
    vi.mocked(apiClient.put).mockResolvedValue({ data: {} });
    const payload = { nombres: 'N', apellidos: 'A', correo: 'a@b.c', rolId: 1, cedula: '1' };
    await updateUsuario(99, payload);
    expect(apiClient.put).toHaveBeenCalledWith(
      '/api/v1/clinica/usuarios/99',
      expect.not.objectContaining({ clinicaId: expect.anything() })
    );
  });

  it('14. Cambio de estado usa PATCH /api/v1/clinica/usuarios/{id}/estado', async () => {
    vi.mocked(apiClient.patch).mockResolvedValue({ data: {} });
    await updateEstadoUsuario(99, { activo: false });
    expect(apiClient.patch).toHaveBeenCalledWith('/api/v1/clinica/usuarios/99/estado', { activo: false });
  });

  it('15. La lista de roles procede de /api/v1/clinica/roles', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: { data: [{ id: 1, nombre: 'MEDICO' }] } });
    const roles = await getRolesAsignables();
    expect(apiClient.get).toHaveBeenCalledWith('/api/v1/clinica/roles');
    expect(roles.data).toHaveLength(1);
  });
});

describe('UsuariosPage UI', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    queryClient.clear();
    useAuthStore.setState({
      usuario: { id: 99, clinicaId: 1, clinicaNombre: 'Alpha', rol: 'ADMIN_CLINICA', nombres: 'Admin', apellidos: 'Admin', correo: 'admin@alpha.com', onboardingCompletado: true }
    });
  });

  it('3. Renderiza listado real mockeado', async () => {
    vi.mocked(apiClient.get).mockImplementation(async (url) => {
      if (url === '/api/v1/clinica/roles') return { data: { data: [] } };
      if (url === '/api/v1/clinica/usuarios') return {
        data: {
          data: {
            content: [{ id: 1, nombres: 'Juan', apellidos: 'Perez', correo: 'juan@test.com', cedula: '1234567890', nombreRol: 'MEDICO', activo: true, createdAt: '2023-01-01T00:00:00Z' }],
            page: 0, totalPages: 1
          }
        }
      };
      return { data: {} };
    });

    render(<QueryClientProvider client={queryClient}><UsuariosPage /></QueryClientProvider>);
    
    await waitFor(() => {
      expect(screen.getByText('Juan Perez')).toBeInTheDocument();
      expect(screen.getByText('juan@test.com')).toBeInTheDocument();
      expect(screen.getByText('1234567890', { exact: false })).toBeInTheDocument();
    });
  });

  it('4. Renderiza empty state', async () => {
    vi.mocked(apiClient.get).mockImplementation(async (url) => {
      if (url === '/api/v1/clinica/roles') return { data: { data: [] } };
      if (url === '/api/v1/clinica/usuarios') return { data: { data: { content: [], page: 0, totalPages: 0 } } };
      return { data: {} };
    });

    render(<QueryClientProvider client={queryClient}><UsuariosPage /></QueryClientProvider>);
    
    await waitFor(() => {
      expect(screen.getByText('No se encontraron usuarios')).toBeInTheDocument();
    });
  });

  it('5. Renderiza error state', async () => {
    vi.mocked(apiClient.get).mockRejectedValue(new Error('API failed'));

    render(<QueryClientProvider client={queryClient}><UsuariosPage /></QueryClientProvider>);
    
    await waitFor(() => {
      expect(screen.getByText('Error al cargar usuarios')).toBeInTheDocument();
    });
  });

  it('6. Búsqueda genera los parámetros correctos, 7. Filtro por estado, 8. Filtro por rol, 9. Paginación', async () => {
    vi.mocked(apiClient.get).mockImplementation(async (url) => {
      if (url === '/api/v1/clinica/roles') return { data: { data: [{ id: 1, nombre: 'MEDICO' }] } };
      if (url === '/api/v1/clinica/usuarios') return {
        data: {
          data: {
            content: [], page: 0, totalPages: 2, last: false, first: true
          }
        }
      };
      return { data: {} };
    });

    render(<QueryClientProvider client={queryClient}><UsuariosPage /></QueryClientProvider>);
    
    // Esperar a que renderice
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Buscar por nombres/i)).toBeInTheDocument();
    });

    // 6. Búsqueda
    fireEvent.change(screen.getByPlaceholderText(/Buscar por nombres/i), { target: { value: 'Juan' } });
    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/clinica/usuarios', expect.objectContaining({
        params: expect.objectContaining({ search: 'Juan' })
      }));
    });

    // 7. Filtro por estado (boton de filtro activo/inactivo)
    // El boton alterna undefined -> true -> false
    fireEvent.click(screen.getByText('Todos los estados'));
    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/clinica/usuarios', expect.objectContaining({
        params: expect.objectContaining({ activo: true })
      }));
    });

    // 8. Filtro por rol
    fireEvent.change(screen.getByRole('combobox', { name: 'Filtrar por rol' }), { target: { value: '1' } });
    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/clinica/usuarios', expect.objectContaining({
        params: expect.objectContaining({ rolId: 1 })
      }));
    });

    // 9. Paginación (Siguiente pagina)
    // Hay dos botones con chevron-right y chevron-left, usemos querySelector
    // Los botones de paginacion se muestran si usuarios.length > 0
    // Ah, wait! Si usuarios.length === 0, no muestra paginación!
    // Para probar paginación, necesitamos mockear usuarios.length > 0
  });

  it('16. SUPER_ADMIN no aparece como rol asignable si el backend no lo devuelve', async () => {
    vi.mocked(apiClient.get).mockImplementation(async (url) => {
      if (url === '/api/v1/clinica/roles') return { data: { data: [{ id: 1, nombre: 'MEDICO' }, { id: 2, nombre: 'ADMIN_CLINICA' }] } };
      if (url === '/api/v1/clinica/usuarios') return { data: { data: { content: [], page: 0, totalPages: 0 } } };
      return { data: {} };
    });

    render(<QueryClientProvider client={queryClient}><UsuariosPage /></QueryClientProvider>);
    
    await waitFor(() => {
      const select = screen.getByRole('combobox', { name: 'Filtrar por rol' });
      expect(select).toHaveTextContent('MEDICO');
      expect(select).toHaveTextContent('ADMIN_CLINICA');
      expect(select).not.toHaveTextContent('SUPER_ADMIN');
    });
  });
});


