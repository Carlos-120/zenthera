import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AxiosHeaders, type AxiosResponse } from 'axios';
import { HistoriaClinicaTab } from '../app/dashboard/pacientes/[id]/HistoriaClinicaTab';
import { useAuthStore } from '../store/authStore';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as apiClinico from '../lib/api/clinico';
import type { ConsultaResponse, HistoriaClinicaResponse } from '../lib/api/clinico';

vi.mock('../store/authStore', () => ({
  useAuthStore: vi.fn(),
}));

vi.mock('../lib/api/clinico', () => ({
  getHistoriaClinica: vi.fn(),
  createConsulta: vi.fn(),
  updateConsulta: vi.fn(),
  finalizarConsulta: vi.fn(),
}));

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const axiosResponse = <T,>(data: T): AxiosResponse<T> => ({
  data,
  status: 200,
  statusText: 'OK',
  headers: {},
  config: { headers: new AxiosHeaders() },
});

const historia = (consultas: ConsultaResponse[] = []): HistoriaClinicaResponse => ({
  id: 1,
  pacienteId: 1,
  createdAt: '',
  updatedAt: '',
  consultas,
});

const consulta = (overrides: Partial<ConsultaResponse> = {}): ConsultaResponse => ({
  id: 1,
  historiaClinicaId: 1,
  medicoId: 1,
  medicoNombres: 'Juan',
  medicoApellidos: 'Pérez',
  estado: 'BORRADOR',
  createdAt: '2026-08-01T10:00:00Z',
  updatedAt: '2026-08-01T10:00:00Z',
  ...overrides,
});

const authState = (rol: string): ReturnType<typeof useAuthStore> => ({
  accessToken: 'token',
  usuario: {
    id: 1,
    nombres: 'Juan',
    apellidos: 'Pérez',
    correo: 'juan@example.com',
    rol,
    clinicaId: 1,
    clinicaNombre: 'Alpha',
    onboardingCompletado: true,
  },
  isAuthenticated: true,
  setAuth: vi.fn(),
  setAccessToken: vi.fn(),
  clearAuth: vi.fn(),
});

const renderWithProvider = (ui: React.ReactElement) => {
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  );
};

describe('HistoriaClinicaTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
  });

  const setupMedico = () => {
    vi.mocked(useAuthStore).mockReturnValue(authState('MEDICO'));
  };

  const setupRecepcionista = () => {
    vi.mocked(useAuthStore).mockReturnValue(authState('RECEPCIONISTA'));
  };

  it('1 & 2. renderiza empty state para MEDICO con botón de nueva consulta', async () => {
    setupMedico();
    vi.mocked(apiClinico.getHistoriaClinica).mockResolvedValueOnce(axiosResponse(historia()));

    renderWithProvider(<HistoriaClinicaTab pacienteId={1} />);

    expect(screen.getByText(/Cargando historia clínica.../i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/No hay consultas registradas/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/Crear la primera consulta/i)).toBeInTheDocument();
  });

  it('renderiza empty state para RECEPCIONISTA SIN botón', async () => {
    setupRecepcionista();
    vi.mocked(apiClinico.getHistoriaClinica).mockResolvedValueOnce(axiosResponse(historia()));

    renderWithProvider(<HistoriaClinicaTab pacienteId={1} />);

    await waitFor(() => {
      expect(screen.getByText(/No hay consultas registradas/i)).toBeInTheDocument();
    });

    expect(screen.queryByText(/Crear la primera consulta/i)).not.toBeInTheDocument();
  });

  it('3. lista consultas', async () => {
    setupMedico();
    vi.mocked(apiClinico.getHistoriaClinica).mockResolvedValueOnce(
      axiosResponse(historia([consulta({ id: 10, medicoApellidos: 'Perez', motivoConsulta: 'Dolor cabeza' })]))
    );

    renderWithProvider(<HistoriaClinicaTab pacienteId={1} />);

    await waitFor(() => {
      expect(screen.getByText('Dolor cabeza')).toBeInTheDocument();
      expect(screen.getByText('BORRADOR')).toBeInTheDocument();
      expect(screen.getByText(/Dr\. Juan Perez/i)).toBeInTheDocument();
    });
  });

  it('4. Nueva consulta abre formulario', async () => {
    setupMedico();
    vi.mocked(apiClinico.getHistoriaClinica).mockResolvedValueOnce(axiosResponse(historia()));

    renderWithProvider(<HistoriaClinicaTab pacienteId={1} />);

    await waitFor(() => {
      expect(screen.getByText(/Crear la primera consulta/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/Crear la primera consulta/i));

    expect(screen.getByText('Motivo de la consulta')).toBeInTheDocument();
    expect(screen.getByText('Guardar Borrador')).toBeInTheDocument();
  });

  it('5, 6, 7. Guardar BORRADOR envía payload correcto (sin clinicaId/medicoId)', async () => {
    setupMedico();
    vi.mocked(apiClinico.getHistoriaClinica).mockResolvedValueOnce(axiosResponse(historia()));

    vi.mocked(apiClinico.createConsulta).mockResolvedValueOnce(axiosResponse(consulta({ id: 20 })));

    renderWithProvider(<HistoriaClinicaTab pacienteId={1} />);

    await waitFor(() => screen.getByText(/Crear la primera consulta/i));
    fireEvent.click(screen.getByText(/Crear la primera consulta/i));

    fireEvent.change(screen.getByLabelText(/Motivo de la consulta/i), { target: { value: 'Fiebre' } });

    fireEvent.click(screen.getByText('Guardar Borrador'));

    await waitFor(() => {
      expect(apiClinico.createConsulta).toHaveBeenCalledWith(1, expect.objectContaining({
        motivoConsulta: 'Fiebre',
        sintomasObservaciones: '',
        diagnosticoInicial: '',
        tratamientoIndicaciones: '',
        notas: '',
      }));
    });
  });

  it('9 & 10 & 11. Detalle BORRADOR permite Editar/Finalizar, FINALIZADA no.', async () => {
    setupMedico();
    const mockConsultas: ConsultaResponse[] = [
      consulta({ id: 10, medicoNombres: 'J', medicoApellidos: 'P', motivoConsulta: 'Borrador test' }),
      consulta({ id: 11, medicoNombres: 'J', medicoApellidos: 'P', estado: 'FINALIZADA', motivoConsulta: 'Finalizada test', finalizadaAt: '2026-08-01T11:00:00Z' }),
    ];

    vi.mocked(apiClinico.getHistoriaClinica).mockResolvedValue(axiosResponse(historia(mockConsultas)));

    const { unmount } = renderWithProvider(<HistoriaClinicaTab pacienteId={1} />);

    await waitFor(() => {
      expect(screen.getByText('Borrador test')).toBeInTheDocument();
    });

    // Abrir borrador
    const buttons = screen.getAllByText('Ver detalles');
    fireEvent.click(buttons[0]); // el borrador

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Editar/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Finalizar/i })).toBeInTheDocument();
    });

    unmount();

    // Test Finalizada
    renderWithProvider(<HistoriaClinicaTab pacienteId={1} />);
    await waitFor(() => screen.getByText('Finalizada test'));

    const buttons2 = screen.getAllByText('Ver detalles');
    fireEvent.click(buttons2[1]); // finalizada

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /Editar/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Finalizar/i })).not.toBeInTheDocument();
      expect(screen.getByText(/Finalizada el:/i)).toBeInTheDocument();
    });
  });

  it('12. validaciones signos vitales', async () => {
    setupMedico();
    vi.mocked(apiClinico.getHistoriaClinica).mockResolvedValueOnce(axiosResponse(historia()));

    const { container } = renderWithProvider(<HistoriaClinicaTab pacienteId={1} />);
    await waitFor(() => screen.getByText(/Crear la primera consulta/i));
    fireEvent.click(screen.getByText(/Crear la primera consulta/i));

    const pesoInput = container.querySelector('input[name="signosVitales.peso"]')!;
    fireEvent.change(pesoInput, { target: { value: '-10' } });

    const spo2Input = container.querySelector('input[name="signosVitales.saturacionOxigeno"]')!;
    fireEvent.change(spo2Input, { target: { value: '150' } });

    fireEvent.click(screen.getByText('Guardar Borrador'));

    await waitFor(() => {
      expect(screen.getByText('El peso no puede ser negativo')).toBeInTheDocument();
      expect(screen.getByText('Máximo 100%')).toBeInTheDocument();
    });

    expect(apiClinico.createConsulta).not.toHaveBeenCalled();
  });

  it('13. error backend visible', async () => {
    setupMedico();
    vi.mocked(apiClinico.getHistoriaClinica).mockResolvedValueOnce(axiosResponse(historia()));

    vi.mocked(apiClinico.createConsulta).mockRejectedValueOnce({
      response: { data: { message: 'El servidor rechazó esto' } }
    });

    renderWithProvider(<HistoriaClinicaTab pacienteId={1} />);
    await waitFor(() => screen.getByText(/Crear la primera consulta/i));
    fireEvent.click(screen.getByText(/Crear la primera consulta/i));

    fireEvent.click(screen.getByText('Guardar Borrador'));

    await waitFor(() => {
      expect(screen.getByText('El servidor rechazó esto')).toBeInTheDocument();
    });
  });
});
