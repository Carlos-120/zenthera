import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ClinicasPage from '../app/dashboard/clinicas/page';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as api from '@/lib/api/clinicas';
import { useAuthStore } from '@/store/authStore';

// Mock dependencies
const mockReplace = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: mockReplace,
    prefetch: vi.fn(),
  })
}));

vi.mock('@/lib/api/clinicas', () => ({
  getAllClinicas: vi.fn(),
  updateEstadoClinica: vi.fn(),
}));

const mockClinicasData = {
  content: [
    { id: 1, ruc: '1111111111001', razonSocial: 'C1', nombre: 'Clinica 1', correo: 'c1@test.com', telefono: '123', direccion: null, ciudad: null, provincia: null, pais: null, zonaHoraria: 'UTC', logo: null, activa: true },
    { id: 2, ruc: '2222222222001', razonSocial: 'C2', nombre: 'Clinica 2', correo: 'c2@test.com', telefono: '456', direccion: null, ciudad: null, provincia: null, pais: null, zonaHoraria: 'UTC', logo: null, activa: false },
  ],
  page: 0,
  size: 10,
  totalElements: 12,
  totalPages: 2,
  first: true,
  last: false,
};

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const renderWithProviders = (ui: React.ReactElement) => {
  const testQueryClient = createTestQueryClient();
  return {
    ...render(
      <QueryClientProvider client={testQueryClient}>
        {ui}
      </QueryClientProvider>
    ),
    queryClient: testQueryClient
  };
};

describe('ClinicasPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      usuario: { id: 1, correo: 'admin@test.com', nombres: 'Admin', apellidos: 'Test', rol: 'SUPER_ADMIN', clinicaId: 1, clinicaNombre: 'Test' },
      accessToken: 'mock-token',
      isAuthenticated: true
    });
  });

  afterEach(() => {
  });

  it('bloquea el acceso si el rol es incorrecto', () => {
    useAuthStore.setState({
      usuario: { id: 2, correo: 'med@test.com', nombres: 'Med', apellidos: 'Test', rol: 'MEDICO', clinicaId: 1, clinicaNombre: 'Test' },
    });

    renderWithProviders(<ClinicasPage />);
    expect(mockReplace).toHaveBeenCalledWith('/dashboard');
  });

  it('muestra el estado de carga inicial', () => {
    vi.mocked(api.getAllClinicas).mockImplementation(() => new Promise(() => {})); // Never resolves
    renderWithProviders(<ClinicasPage />);
    expect(screen.getByText('Cargando datos...')).toBeInTheDocument();
  });

  it('muestra estado de error si la API falla', async () => {
    vi.mocked(api.getAllClinicas).mockRejectedValue(new Error('Network error'));
    renderWithProviders(<ClinicasPage />);

    await waitFor(() => {
      expect(screen.getByText('Error al cargar las clínicas')).toBeInTheDocument();
    });
  });

  it('muestra el estado vacío si no hay clínicas', async () => {
    vi.mocked(api.getAllClinicas).mockResolvedValue({
      success: true,
      message: 'OK',
      data: { content: [], page: 0, size: 10, totalElements: 0, totalPages: 0, first: true, last: true }
    });

    renderWithProviders(<ClinicasPage />);

    await waitFor(() => {
      expect(screen.getByText('No se encontraron clínicas')).toBeInTheDocument();
    });
  });

  it('renderiza la lista de clínicas y respeta el contrato page/size', async () => {
    vi.mocked(api.getAllClinicas).mockResolvedValue({
      success: true,
      message: 'OK',
      data: mockClinicasData
    });

    renderWithProviders(<ClinicasPage />);

    await waitFor(() => {
      expect(screen.getByText('Clinica 1')).toBeInTheDocument();
    });
    expect(screen.getByText('Clinica 2')).toBeInTheDocument();

    expect(api.getAllClinicas).toHaveBeenCalledWith({ search: '', page: 0, size: 10 });

    // Verifica datos en la tabla
    expect(screen.getByText('1111111111001')).toBeInTheDocument();
    expect(screen.getByText('ACTIVA')).toBeInTheDocument();
    expect(screen.getByText('SUSPENDIDA')).toBeInTheDocument();
  });

  it('ejecuta búsqueda con debounce y reinicia a página cero', async () => {
    vi.mocked(api.getAllClinicas).mockResolvedValue({
      success: true,
      message: 'OK',
      data: mockClinicasData
    });

    renderWithProviders(<ClinicasPage />);

    await waitFor(() => {
      expect(screen.getByText('Clinica 1')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Buscar por RUC o Nombre/);
    // Esperar a que renderice la lista
    // Wait, let's just trigger a search and check the API call.

    fireEvent.change(searchInput, { target: { value: 'test search' } });

    // Debería esperar al debounce (500ms) usando sleep real
    await new Promise(r => setTimeout(r, 600));

    await waitFor(() => {
      expect(api.getAllClinicas).toHaveBeenCalledWith({ search: 'test search', page: 0, size: 10 });
    });
  });

  it('permite navegación de paginación', async () => {
    vi.mocked(api.getAllClinicas).mockResolvedValue({
      success: true,
      message: 'OK',
      data: mockClinicasData
    });

    renderWithProviders(<ClinicasPage />);

    await waitFor(() => {
      expect(screen.getByText('Clinica 1')).toBeInTheDocument();
    });

    // Botón Next (es el segundo botón del grupo de paginación)
    const buttons = screen.getAllByRole('button');
    const nextBtn = buttons[buttons.length - 1]; // El último botón es next

    fireEvent.click(nextBtn);

    await waitFor(() => {
      expect(api.getAllClinicas).toHaveBeenCalledWith({ search: '', page: 1, size: 10 });
    });
  });

  it('abre y cierra el modal de estado', async () => {
    vi.mocked(api.getAllClinicas).mockResolvedValue({
      success: true,
      message: 'OK',
      data: mockClinicasData
    });

    renderWithProviders(<ClinicasPage />);

    await waitFor(() => {
      expect(screen.getByText('Clinica 1')).toBeInTheDocument();
    });

    // Click suspender en la primera clínica
    const suspenderBtn = screen.getByText('Suspender');
    fireEvent.click(suspenderBtn);

    expect(screen.getByRole('dialog')).toBeInTheDocument();

    // Click cerrar
    const cerrarBtn = screen.getByLabelText('Cerrar modal');
    fireEvent.click(cerrarBtn);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('realiza el PATCH para cambiar estado y luego invalida la caché', async () => {
    vi.mocked(api.getAllClinicas).mockResolvedValue({
      success: true,
      message: 'OK',
      data: mockClinicasData
    });

    vi.mocked(api.updateEstadoClinica).mockResolvedValue({
      success: true,
      message: 'OK',
      data: { ...mockClinicasData.content[0], activa: false }
    });

    const { queryClient } = renderWithProviders(<ClinicasPage />);
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    await waitFor(() => {
      expect(screen.getByText('Clinica 1')).toBeInTheDocument();
    });

    // Click suspender
    fireEvent.click(screen.getByText('Suspender'));

    const textarea = screen.getByPlaceholderText(/Escriba el motivo/);
    fireEvent.change(textarea, { target: { value: 'Motivo válido' } });

    fireEvent.click(screen.getByRole('button', { name: 'Confirmar Suspensión' }));

    await waitFor(() => {
      expect(api.updateEstadoClinica).toHaveBeenCalledWith(1, { activa: false, motivo: 'Motivo válido' });
    });

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['clinicas'] });
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(); // Se cierra tras éxito
    });
  });

  it('realiza el PATCH para reactivar clínica con activa: true', async () => {
    vi.mocked(api.getAllClinicas).mockResolvedValue({
      success: true,
      message: 'OK',
      data: mockClinicasData
    });

    vi.mocked(api.updateEstadoClinica).mockResolvedValue({
      success: true,
      message: 'OK',
      data: { ...mockClinicasData.content[1], activa: true }
    });

    renderWithProviders(<ClinicasPage />);

    await waitFor(() => {
      expect(screen.getByText('Clinica 2')).toBeInTheDocument();
    });

    // Click reactivar en la segunda clínica
    fireEvent.click(screen.getByText('Reactivar'));

    const textarea = screen.getByPlaceholderText(/Escriba el motivo/);
    fireEvent.change(textarea, { target: { value: 'Motivo de reactivación' } });

    fireEvent.click(screen.getByRole('button', { name: 'Confirmar Reactivación' }));

    await waitFor(() => {
      expect(api.updateEstadoClinica).toHaveBeenCalledWith(2, { activa: true, motivo: 'Motivo de reactivación' });
    });
  });

  it('muestra mensaje de error dentro del modal si el PATCH falla', async () => {
    vi.mocked(api.getAllClinicas).mockResolvedValue({
      success: true,
      message: 'OK',
      data: mockClinicasData
    });

    vi.mocked(api.updateEstadoClinica).mockRejectedValue({
      response: { data: { message: 'No se puede suspender en este momento' } }
    });

    renderWithProviders(<ClinicasPage />);

    await waitFor(() => {
      expect(screen.getByText('Clinica 1')).toBeInTheDocument();
    });

    // Click suspender
    fireEvent.click(screen.getByText('Suspender'));

    const textarea = screen.getByPlaceholderText(/Escriba el motivo/);
    fireEvent.change(textarea, { target: { value: 'Motivo válido' } });

    fireEvent.click(screen.getByRole('button', { name: 'Confirmar Suspensión' }));

    await waitFor(() => {
      expect(screen.getByText('No se puede suspender en este momento')).toBeInTheDocument();
      // El modal debe seguir abierto
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });
});
