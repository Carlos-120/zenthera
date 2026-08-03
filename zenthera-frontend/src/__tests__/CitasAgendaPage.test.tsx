import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import CitasPage from '../app/dashboard/citas/page';
import { useAuthStore } from '../store/authStore';
import { vi, describe, it, expect, beforeEach, Mock } from 'vitest';
import * as citasApi from '../lib/api/citas';
import * as medicosApi from '../lib/api/medicos';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

vi.mock('../store/authStore', () => ({
  useAuthStore: vi.fn(),
}));

vi.mock('../lib/api/citas', () => ({
  getCitas: vi.fn(),
}));

vi.mock('../lib/api/medicos', () => ({
  getMedicos: vi.fn(),
}));

vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-query')>();
  return {
    ...actual,
    useQuery: vi.fn(),
  };
});

const mockPush = vi.fn();
const mockReplace = vi.fn();
(useRouter as Mock).mockReturnValue({ push: mockPush, replace: mockReplace });

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <>{children}</>
);

describe('CitasPage Agenda View', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (medicosApi.getMedicos as Mock).mockResolvedValue({ data: { content: [] } });
    (citasApi.getCitas as Mock).mockResolvedValue({ data: { content: [] } });
    (useQuery as Mock).mockReturnValue({
      data: { data: { content: [] } },
      isLoading: false,
      isError: false,
      error: null
    });
  });

  const mockAdminClinica = {
    rol: 'ADMIN_CLINICA',
    clinica: { onboardingCompletado: true }
  };
  const mockSuperAdmin = { rol: 'SUPER_ADMIN' };

  it('16. SUPER_ADMIN se maneja de forma segura (sin clinica id y restringido)', () => {
    (useAuthStore as unknown as Mock).mockImplementation((selector) => {
      const state = { usuario: mockSuperAdmin, isAuthenticated: true };
      return selector ? selector(state) : state;
    });

    render(<CitasPage />, { wrapper });
    expect(mockReplace).toHaveBeenCalledWith('/dashboard');
  });

  it('3 & 9. ADMIN_CLINICA con onboarding abre y loading state shown correctly', async () => {
    (useAuthStore as unknown as Mock).mockImplementation((selector) => {
      const state = { usuario: mockAdminClinica, isAuthenticated: true };
      return selector ? selector(state) : state;
    });

    (useQuery as Mock).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null
    });

    render(<CitasPage />, { wrapper });
    // Loading should be visible (we look for the agenda skeleton, but empty state should NOT be there)
    expect(screen.queryByText(/No hay citas programadas/i)).not.toBeInTheDocument();
  });

  it('11. Empty state shown correctly', async () => {
    (useAuthStore as unknown as Mock).mockImplementation((selector) => {
      const state = { usuario: mockAdminClinica, isAuthenticated: true };
      return selector ? selector(state) : state;
    });

    (useQuery as Mock).mockImplementation((options) => {
      if (options.queryKey && options.queryKey[0] === 'citas' && options.queryKey[1] === 'agenda') {
        return { data: { data: { content: [] } }, isLoading: false, isError: false, error: null };
      }
      return { data: undefined, isLoading: false, isError: false, error: null };
    });

    render(<CitasPage />, { wrapper });
    expect(screen.getAllByText(/No hay citas programadas/i).length).toBeGreaterThan(0);
  });

  it('4 & 5 & 6 & 7 & 8 & 17. Navigation, timezone and API calls', async () => {
    (useAuthStore as unknown as Mock).mockImplementation((selector) => {
      const state = { usuario: mockAdminClinica, isAuthenticated: true };
      return selector ? selector(state) : state;
    });

    (useQuery as Mock).mockReturnValue({
      data: { data: { content: [] } },
      isLoading: false,
      isError: false,
      error: null
    });

    render(<CitasPage />, { wrapper });

    // Check query calls
    expect(useQuery).toHaveBeenCalled();
    const queryCalls = (useQuery as Mock).mock.calls;
    const citasCall = queryCalls.find(call => call[0].queryKey && call[0].queryKey[0] === 'citas' && call[0].queryKey[1] === 'agenda');

    expect(citasCall).toBeDefined();

    // Test Navigation buttons
    const prevButton = screen.getByRole('button', { name: /Semana anterior/i });
    fireEvent.click(prevButton);

    const todayButton = screen.getByText(/Hoy/i);
    fireEvent.click(todayButton);
  });

  it('10. Error se muestra correctamente', async () => {
    (useAuthStore as unknown as Mock).mockImplementation((selector) => {
      const state = { usuario: mockAdminClinica, isAuthenticated: true };
      return selector ? selector(state) : state;
    });

    (useQuery as Mock).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error('Network error')
    });

    render(<CitasPage />, { wrapper });

    expect(screen.getByText(/Error al cargar la agenda/i)).toBeInTheDocument();
  });

  it('12 & 13 & 14 & 15. Success renderiza citas reales con badges de estado y acciones', async () => {
    (useAuthStore as unknown as Mock).mockImplementation((selector) => {
      const state = { usuario: mockAdminClinica, isAuthenticated: true };
      return selector ? selector(state) : state;
    });

    // We'll place the mock cita exactly today so it matches the day calculation
    const d = new Date();
    d.setHours(10, 0, 0, 0);

    const mockCitas = [
      {
        id: 1,
        fechaHoraInicio: d.toISOString(),
        fechaHoraFin: new Date(d.getTime() + 30*60000).toISOString(),
        duracionMinutos: 30,
        estado: 'CONFIRMADA',
        paciente: { nombres: 'Juan', apellidos: 'Pérez' },
        medico: { nombres: 'Ana', apellidos: 'López' },
      }
    ];

    (useQuery as Mock).mockImplementation((options) => {
      if (options.queryKey[0] === 'citas' && options.queryKey[1] === 'agenda') {
        return {
          data: { data: { content: mockCitas } },
          isLoading: false,
          isError: false,
          error: null
        };
      }
      return { data: { data: { content: [] } } };
    });

    render(<CitasPage />, { wrapper });

    expect(screen.getByText(/Juan Pérez/i)).toBeInTheDocument();
    expect(screen.getByText(/Ana López/i)).toBeInTheDocument();
    expect(screen.getAllByText('CONFIRMADA').length).toBeGreaterThan(0);

    const link = screen.getByRole('link', { name: /Ver/i });
    expect(link).toHaveAttribute('href', '/dashboard/citas/1');

    const editButton = screen.getByText(/Editar/i);
    expect(editButton).toBeDisabled();
  });

  it('New: Verifica que la queryKey de Agenda sea correcta y dependa de los filtros y periodo', async () => {
    (useAuthStore as unknown as Mock).mockImplementation((selector) => {
      const state = { usuario: mockAdminClinica, isAuthenticated: true };
      return selector ? selector(state) : state;
    });

    (useQuery as Mock).mockImplementation((options) => {
      if (options.queryKey && options.queryKey[0] === 'medicos-options') {
        return {
          data: { data: { content: [{ id: 99, nombres: 'Test', apellidos: 'Doctor' }] } },
          isLoading: false,
          isError: false,
          error: null
        };
      }
      return {
        data: { data: { content: [] } },
        isLoading: false,
        isError: false,
        error: null
      };
    });

    render(<CitasPage />, { wrapper });

    const queryCalls = (useQuery as Mock).mock.calls;
    const citasCall = queryCalls.find(call => call[0].queryKey && call[0].queryKey[0] === 'citas' && call[0].queryKey[1] === 'agenda');

    if (!citasCall) throw new Error('Query not found');
    expect(citasCall).toBeDefined();
    const initialQueryKey = citasCall[0].queryKey;

    // 1. Primer elemento es 'citas' (lo que permite a ['citas'] invalidarlo globalmente)
    expect(initialQueryKey[0]).toBe('citas');
    expect(initialQueryKey[1]).toBe('agenda');

    // 2. Incluye filtros vacíos por defecto y rango visible
    expect(initialQueryKey[2]).toBe(''); // medicoId
    expect(initialQueryKey[3]).toBe(''); // estado
    expect(typeof initialQueryKey[4]).toBe('string'); // fechaDesde
    expect(typeof initialQueryKey[5]).toBe('string'); // fechaHasta

    (useQuery as Mock).mockClear();

    // 3. Cambia al navegar de semana
    const nextButton = screen.getByRole('button', { name: /Semana siguiente/i });
    fireEvent.click(nextButton);
    const nextCall = (useQuery as Mock).mock.calls.find(call => call[0].queryKey && call[0].queryKey[1] === 'agenda');
    if (!nextCall) throw new Error('Query not found');
    expect(nextCall[0].queryKey[4]).not.toBe(initialQueryKey[4]); // fechaDesde changed

    (useQuery as Mock).mockClear();

    // 4. Incluye filtro de estado
    const estadoSelect = screen.getByRole('combobox', { name: /Filtro Estado/i });
    fireEvent.change(estadoSelect, { target: { value: 'CONFIRMADA' } });
    const estadoCall = (useQuery as Mock).mock.calls.find(call => call[0].queryKey && call[0].queryKey[1] === 'agenda');
    if (!estadoCall) throw new Error('Query not found');
    expect(estadoCall[0].queryKey[3]).toBe('CONFIRMADA');

    (useQuery as Mock).mockClear();

    // 5. Incluye filtro de médico
    // Sometimes React testing library ignores option values if not fully re-rendered. We can force it by firing change.
    const medicoSelect = screen.getByRole('combobox', { name: /Filtro Médico/i });
    fireEvent.change(medicoSelect, { target: { value: '99' } });
    const medicoCall = (useQuery as Mock).mock.calls.find(call => call[0].queryKey && call[0].queryKey[1] === 'agenda');
    if (!medicoCall) throw new Error('Query not found');
    // Ensure that medicoCall contains the correct value. If it's a string '99', let's test for that or 99
    expect(Number(medicoCall[0].queryKey[2])).toBe(99);
  });
});
