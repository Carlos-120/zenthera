import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import MiClinicaPage from '../app/dashboard/mi-clinica/page';
import { ClinicaSettingsForm } from '../components/clinica/ClinicaSettingsForm';
import { useAuthStore, UserProfile } from '../store/authStore';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import apiClient from '../lib/axios';

// Mocks
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn()
  })),
}));

vi.mock('../lib/axios', () => ({
  default: {
    get: vi.fn(),
    put: vi.fn(),
  }
}));

const mockQueryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } }
});

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <QueryClientProvider client={mockQueryClient}>
      {ui}
    </QueryClientProvider>
  );
};

const mockAdminClinica: UserProfile = {
  id: 1,
  nombres: 'Test',
  apellidos: 'User',
  correo: 'test@test.com',
  rol: 'ADMIN_CLINICA',
  clinicaId: 1,
  clinicaNombre: 'Mi Clinica'
};

const mockClinicaData = {
  data: {
    data: {
      id: 1,
      ruc: '0999999999001',
      razonSocial: 'CLINICA TEST S.A.',
      nombre: 'Clínica Especialidades',
      correo: 'contacto@clinica.com',
      telefono: '0999999999',
      direccion: 'Av Principal',
      ciudad: 'Guayaquil',
      provincia: 'Guayas',
      pais: 'Ecuador',
      zonaHoraria: 'America/Guayaquil',
      logo: null,
      activa: true
    }
  }
};

describe('Mi Clínica Page & Settings Form', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockQueryClient.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('no debe renderizar nada si el rol es incorrecto', async () => {
    useAuthStore.getState().setAuth('token', { ...mockAdminClinica, rol: 'SUPER_ADMIN' });

    renderWithProviders(<MiClinicaPage />);

    // RoleGuard no debe renderizar el form
    expect(screen.queryByTestId('clinica-settings-form')).not.toBeInTheDocument();
  });

  it('debe cargar y mostrar los datos correctamente', async () => {
    useAuthStore.getState().setAuth('token', mockAdminClinica);
    vi.mocked(apiClient.get).mockResolvedValueOnce(mockClinicaData);

    renderWithProviders(<MiClinicaPage />);

    expect(screen.getByText('Cargando información de la clínica...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId('clinica-settings-form')).toBeInTheDocument();
    });

    // Campos read-only
    expect(screen.getByDisplayValue('0999999999001')).toHaveAttribute('readonly');
    expect(screen.getByDisplayValue('CLINICA TEST S.A.')).toBeInTheDocument();

    // Normalización null a '' (Logo era null, debe ser string vacío)
    const logoInput = screen.getByLabelText(/URL del Logo/i);
    expect(logoInput).toHaveValue('');

    // Valores inicializados
    expect(screen.getByLabelText(/Nombre Comercial/i)).toHaveValue('Clínica Especialidades');
  });

  it('debe mostrar errores de validación si faltan campos obligatorios', async () => {
    useAuthStore.getState().setAuth('token', mockAdminClinica);
    vi.mocked(apiClient.get).mockResolvedValueOnce(mockClinicaData);

    renderWithProviders(<MiClinicaPage />);

    await waitFor(() => {
      expect(screen.getByTestId('clinica-settings-form')).toBeInTheDocument();
    });

    // Limpiar nombre y hacer submit
    const nombreInput = screen.getByLabelText(/Nombre Comercial/i);
    fireEvent.change(nombreInput, { target: { value: '' } });

    const submitBtn = screen.getByRole('button', { name: /Guardar Cambios/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('El nombre es obligatorio')).toBeInTheDocument();
    });

    // Validar correo
    const correoInput = screen.getByLabelText(/Correo de Contacto/i);
    fireEvent.change(correoInput, { target: { value: 'correo-invalido' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Correo inválido')).toBeInTheDocument();
    });

    // El mutation no debe llamarse
    expect(apiClient.put).not.toHaveBeenCalled();
  });

  it('debe enviar la actualización e invalidar query tras éxito', async () => {
    useAuthStore.getState().setAuth('token', mockAdminClinica);
    vi.mocked(apiClient.get).mockResolvedValueOnce(mockClinicaData);
    vi.mocked(apiClient.put).mockResolvedValueOnce({ data: { data: {} } }); // Respuesta exitosa

    const invalidateSpy = vi.spyOn(mockQueryClient, 'invalidateQueries');

    renderWithProviders(<MiClinicaPage />);

    await waitFor(() => {
      expect(screen.getByTestId('clinica-settings-form')).toBeInTheDocument();
    });

    const nombreInput = screen.getByLabelText(/Nombre Comercial/i);
    fireEvent.change(nombreInput, { target: { value: 'Nuevo Nombre' } });

    const submitBtn = screen.getByRole('button', { name: /Guardar Cambios/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(apiClient.put).toHaveBeenCalledWith('/api/v1/clinica', expect.objectContaining({
        nombre: 'Nuevo Nombre'
      }));
      const putCall = vi.mocked(apiClient.put).mock.calls[0][1];
      expect(putCall).not.toHaveProperty('ruc');
    });

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['mi-clinica'] });
    });
  });

  it('debe manejar error de backend al actualizar', async () => {
    useAuthStore.getState().setAuth('token', mockAdminClinica);
    vi.mocked(apiClient.get).mockResolvedValueOnce(mockClinicaData);
    vi.mocked(apiClient.put).mockRejectedValueOnce({
      response: { data: { message: 'El correo ya está en uso' } }
    });

    renderWithProviders(<MiClinicaPage />);

    await waitFor(() => {
      expect(screen.getByTestId('clinica-settings-form')).toBeInTheDocument();
    });

    const submitBtn = screen.getByRole('button', { name: /Guardar Cambios/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('El correo ya está en uso')).toBeInTheDocument();
    });
  });

  it('debe resincronizar los campos cuando el initialData cambia (refetch)', async () => {
    const { rerender } = render(
      <ClinicaSettingsForm
        initialData={mockClinicaData.data.data}
        onSubmit={vi.fn()}
        isPending={false}
      />
    );

    expect(screen.getByLabelText(/Nombre Comercial/i)).toHaveValue('Clínica Especialidades');

    // Simulamos un refetch con datos nuevos
    const newData = { ...mockClinicaData.data.data, nombre: 'Nombre Actualizado por Refetch' };

    rerender(
      <ClinicaSettingsForm
        initialData={newData}
        onSubmit={vi.fn()}
        isPending={false}
      />
    );

    // Debe mostrar el nuevo nombre
    await waitFor(() => {
      expect(screen.getByLabelText(/Nombre Comercial/i)).toHaveValue('Nombre Actualizado por Refetch');
    });
  });
});
