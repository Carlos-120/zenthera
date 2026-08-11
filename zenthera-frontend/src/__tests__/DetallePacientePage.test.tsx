import React from 'react';
import { render, screen, waitFor, act, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import DetallePacientePage from '../app/dashboard/pacientes/[id]/page';
import * as pacienteApi from '../lib/api/pacientes';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';

const pushMock = vi.fn();
const replaceMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
    replace: replaceMock,
  }),
}));

export const roleGuardMock = vi.fn(({ children }: { children: React.ReactNode }) => <>{children}</>);
vi.mock('../components/auth/RoleGuard', () => ({
  RoleGuard: (props: { children: React.ReactNode; allowedRoles: string[] }) => roleGuardMock(props),
}));

const mockPaciente = {
  id: 1,
  cedula: '1234567890',
  nombres: 'Juan',
  apellidos: 'Perez',
  fechaNacimiento: '1990-01-01',
  sexo: 'MASCULINO' as const,
  telefono: '0999999999',
  correo: 'juan@test.com',
  direccion: 'Calle Falsa 123',
  tipoSangre: 'O+',
  alergias: 'Ninguna',
  contactoEmergencia: 'Maria',
  telefonoEmergencia: '0988888888',
  activo: true,
  createdAt: '2026-08-01T00:00:00Z',
  updatedAt: '2026-08-01T00:00:00Z',
};

describe('DetallePacientePage', () => {
  let queryClient: QueryClient;
  
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.getState().setAuth('token', {
      id: 1,
      nombres: 'Test',
      apellidos: 'User',
      correo: 'test@test.com',
      rol: 'ADMIN_CLINICA',
      clinicaId: 1,
      clinicaNombre: 'Alpha',
      onboardingCompletado: true
    });
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    vi.restoreAllMocks();
  });

  const renderComponent = async (id: string = '1') => {
    // Next.js 16 params is a promise
    const paramsPromise = Promise.resolve({ id });
    return render(
      <QueryClientProvider client={queryClient}>
        <React.Suspense fallback={<div>Cargando suspense...</div>}>
          <DetallePacientePage params={paramsPromise} />
        </React.Suspense>
      </QueryClientProvider>
    );
  };

  it('1 & 2. Loading y Endpoint', async () => {
    const getSpy = vi.spyOn(pacienteApi, 'getPacienteById').mockImplementation(() => new Promise(() => {}));
    await act(async () => { await renderComponent(); });
    expect(screen.getByText(/Cargando/i)).toBeTruthy();
    expect(getSpy).toHaveBeenCalledWith(1);
  });

  it('3 & 4. Error genérico y Not Found', async () => {
    vi.spyOn(pacienteApi, 'getPacienteById').mockRejectedValue({ response: { status: 404 } });
    await act(async () => { await renderComponent(); });
    await waitFor(() => {
      expect(screen.getByText(/Paciente no encontrado/i)).toBeTruthy();
    });

  });

  it('4. Error genérico', async () => {
    vi.spyOn(pacienteApi, 'getPacienteById').mockRejectedValue({ response: { status: 500, data: { message: 'Internal Error' } } });
    await act(async () => { await renderComponent(); });
    await waitFor(() => {
      expect(screen.getByText(/Error al cargar/i)).toBeTruthy();
      expect(screen.getByText(/Internal Error/i)).toBeTruthy();
    });
  });

  it('5, 6, 7 & 14. Renderizado, Edad, Fecha sin NaN/Invalid Date, Estado Activo', async () => {
    vi.spyOn(pacienteApi, 'getPacienteById').mockResolvedValue({ success: true, message: 'OK', data: mockPaciente });
    await act(async () => {
      await act(async () => { await renderComponent(); });
    });
    await waitFor(() => {
      expect(screen.getByText('Juan Perez')).toBeTruthy();
    });
    
    // Verifica datos reales
    expect(screen.getByText('1234567890')).toBeTruthy();
    
    // Verifica que la edad sea unúmero válido y no contenga NaN
    const textContent = document.body.textContent || '';
    expect(textContent).not.toMatch(/NaN/);
    expect(textContent).not.toMatch(/Invalid Date/);

    // Estado Activo
    expect(screen.getByText('Activo')).toBeTruthy();
  });

  it('8 & 9. Acción Editar y Carga de datos', async () => {
    vi.spyOn(pacienteApi, 'getPacienteById').mockResolvedValue({ success: true, message: 'OK', data: mockPaciente });
    await act(async () => {
      await act(async () => { await renderComponent(); });
    });
    await waitFor(() => {
      expect(screen.getByText('Juan Perez')).toBeTruthy();
    });
    
    const editBtn = screen.getByText(/Editar Informaci.n/i);
    fireEvent.click(editBtn);

    // Esperar que el formulario cargue
    const nombresInput = screen.getByLabelText(/Nombres/i) as HTMLInputElement;
    expect(nombresInput.value).toBe('Juan');
  });

  it('10, 11, 12, 13 & 15. Guardar usa endpoint, refresca detalle, maneja error, payload sin clinicaId', async () => {
    vi.spyOn(pacienteApi, 'getPacienteById').mockResolvedValue({ success: true, message: 'OK', data: mockPaciente });
    const updateSpy = vi.spyOn(pacienteApi, 'updatePaciente').mockResolvedValue({ success: true, message: 'OK', data: { ...mockPaciente, nombres: 'Juan Mod' } });
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    await act(async () => {
      await act(async () => { await renderComponent(); });
    });
    await waitFor(() => {
      expect(screen.getByText('Juan Perez')).toBeTruthy();
    });
    
    fireEvent.click(screen.getByText(/Editar Informaci.n/i));

    const nombresInput = screen.getByLabelText(/Nombres/i);
    fireEvent.change(nombresInput, { target: { value: 'Juan Mod' } });

    fireEvent.click(screen.getByText(/Guardar Cambios/i));

    await waitFor(() => {
      expect(updateSpy).toHaveBeenCalledWith(1, expect.objectContaining({ nombres: 'Juan Mod' }));
    });
    
    // Verificar que clinicaId no está en el payload mandado (el objectContaining no debe tenerlo de todos modos)
    const payloadSent = updateSpy.mock.calls[0][1] as Record<string, unknown>;
    expect(payloadSent.clinicaId).toBeUndefined();

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['pacientes'] });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['paciente', 1] });
    });

    vi.spyOn(pacienteApi, 'getPacienteById').mockRejectedValue({ response: { status: 500, data: { message: 'Internal Error' } } });
    await act(async () => { await renderComponent(); });
    await waitFor(() => {
      expect(screen.getAllByText(/Error al cargar/i)[0]).toBeTruthy();
      expect(screen.getAllByText(/Internal Error/i)[0]).toBeTruthy();
    });
  });

  it('5, 6, 7 & 14. Renderizado, Edad, Fecha sin NaN/Invalid Date, Estado Activo', async () => {
    vi.spyOn(pacienteApi, 'getPacienteById').mockResolvedValue({ success: true, message: 'OK', data: mockPaciente });
    await act(async () => {
      await act(async () => { await renderComponent(); });
    });
    await waitFor(() => {
      expect(screen.getByText('Juan Perez')).toBeTruthy();
    });
    
    // Verifica datos reales
    expect(screen.getByText('1234567890')).toBeTruthy();
    
    // Verifica que la edad sea unúmero válido y no contenga NaN
    const textContent = document.body.textContent || '';
    expect(textContent).not.toMatch(/NaN/);
    expect(textContent).not.toMatch(/Invalid Date/);

    // Estado Activo
    expect(screen.getByText('Activo')).toBeTruthy();
  });

  it('8 & 9. Acción Editar y Carga de datos', async () => {
    vi.spyOn(pacienteApi, 'getPacienteById').mockResolvedValue({ success: true, message: 'OK', data: mockPaciente });
    await act(async () => {
      await act(async () => { await renderComponent(); });
    });
    await waitFor(() => {
      expect(screen.getByText('Juan Perez')).toBeTruthy();
    });
    
    const editBtn = screen.getByText(/Editar Informaci.n/i);
    fireEvent.click(editBtn);

    // Esperar que el formulario cargue
    const nombresInput = screen.getByLabelText(/Nombres/i) as HTMLInputElement;
    expect(nombresInput.value).toBe('Juan');
  });

  it('10, 11, 12, 13 & 15. Guardar usa endpoint, refresca detalle, maneja error, payload sin clinicaId', async () => {
    vi.spyOn(pacienteApi, 'getPacienteById').mockResolvedValue({ success: true, message: 'OK', data: mockPaciente });
    const updateSpy = vi.spyOn(pacienteApi, 'updatePaciente').mockResolvedValue({ success: true, message: 'OK', data: { ...mockPaciente, nombres: 'Juan Mod' } });
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    await act(async () => {
      await act(async () => { await renderComponent(); });
    });
    await waitFor(() => {
      expect(screen.getByText('Juan Perez')).toBeTruthy();
    });
    
    fireEvent.click(screen.getByText(/Editar Informaci.n/i));

    const nombresInput = screen.getByLabelText(/Nombres/i);
    fireEvent.change(nombresInput, { target: { value: 'Juan Mod' } });

    fireEvent.click(screen.getByText(/Guardar Cambios/i));

    await waitFor(() => {
      expect(updateSpy).toHaveBeenCalledWith(1, expect.objectContaining({ nombres: 'Juan Mod' }));
    });
    
    // Verificar que clinicaId no está en el payload mandado (el objectContaining no debe tenerlo de todos modos)
    const payloadSent = updateSpy.mock.calls[0][1] as Record<string, unknown>;
    expect(payloadSent.clinicaId).toBeUndefined();

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['pacientes'] });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['paciente', 1] });
    });

    // Probar error
    vi.spyOn(pacienteApi, 'getPacienteById').mockRejectedValue({ response: { status: 500, data: { message: 'Internal Error' } } });
    await act(async () => { await renderComponent(); });
    await waitFor(() => {
      expect(screen.getAllByText(/Error al cargar/i)[0]).toBeTruthy();
      expect(screen.getAllByText(/Internal Error/i)[0]).toBeTruthy();
    });
  });

  it('5, 6, 7 & 14. Renderizado, Edad, Fecha sin NaN/Invalid Date, Estado Activo', async () => {
    vi.spyOn(pacienteApi, 'getPacienteById').mockResolvedValue({ success: true, message: 'OK', data: mockPaciente });
    await act(async () => {
      await act(async () => { await renderComponent(); });
    });
    await waitFor(() => {
      expect(screen.getByText('Juan Perez')).toBeTruthy();
    });
    
    // Verifica datos reales
    expect(screen.getByText('1234567890')).toBeTruthy();
    
    // Verifica que la edad sea unúmero válido y no contenga NaN
    const textContent = document.body.textContent || '';
    expect(textContent).not.toMatch(/NaN/);
    expect(textContent).not.toMatch(/Invalid Date/);

    // Estado Activo
    expect(screen.getByText('Activo')).toBeTruthy();
  });

  it('8 & 9. Acción Editar y Carga de datos', async () => {
    vi.spyOn(pacienteApi, 'getPacienteById').mockResolvedValue({ success: true, message: 'OK', data: mockPaciente });
    await act(async () => {
      await act(async () => { await renderComponent(); });
    });
    await waitFor(() => {
      expect(screen.getByText('Juan Perez')).toBeTruthy();
    });
    
    const editBtn = screen.getByText(/Editar Informaci.n/i);
    fireEvent.click(editBtn);

    // Esperar que el formulario cargue
    const nombresInput = screen.getByLabelText(/Nombres/i) as HTMLInputElement;
    expect(nombresInput.value).toBe('Juan');
  });

  it('10, 11, 12, 13 & 15. Guardar usa endpoint, refresca detalle, maneja error, payload sin clinicaId', async () => {
    vi.spyOn(pacienteApi, 'getPacienteById').mockResolvedValue({ success: true, message: 'OK', data: mockPaciente });
    const updateSpy = vi.spyOn(pacienteApi, 'updatePaciente').mockResolvedValue({ success: true, message: 'OK', data: { ...mockPaciente, nombres: 'Juan Mod' } });
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    await act(async () => {
      await act(async () => { await renderComponent(); });
    });
    await waitFor(() => {
      expect(screen.getByText('Juan Perez')).toBeTruthy();
    });
    
    fireEvent.click(screen.getByText(/Editar Informaci.n/i));

    const nombresInput = screen.getByLabelText(/Nombres/i);
    fireEvent.change(nombresInput, { target: { value: 'Juan Mod' } });

    fireEvent.click(screen.getByText(/Guardar Cambios/i));

    await waitFor(() => {
      expect(updateSpy).toHaveBeenCalledWith(1, expect.objectContaining({ nombres: 'Juan Mod' }));
    });
    
    // Verificar que clinicaId no está en el payload mandado (el objectContaining no debe tenerlo de todos modos)
    const payloadSent = updateSpy.mock.calls[0][1] as Record<string, unknown>;
    expect(payloadSent.clinicaId).toBeUndefined();

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['pacientes'] });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['paciente', 1] });
    });

    // Probar error
    fireEvent.click(screen.getByText(/Editar Informaci.n/i));
    fireEvent.change(screen.getByLabelText(/Nombres/i), { target: { value: 'Juan Mod 2' } });
    updateSpy.mockRejectedValueOnce({ response: { data: { message: 'Error de servidor' } } });
    fireEvent.click(screen.getByText(/Guardar Cambios/i));
    await waitFor(() => {
      expect(screen.getByText('Error de servidor')).toBeTruthy();
    });
  });

  it('16. Editar Información no navega a dashboard', async () => {
    vi.spyOn(pacienteApi, 'getPacienteById').mockResolvedValue({ success: true, message: 'OK', data: mockPaciente });

    await act(async () => {
      await act(async () => { await renderComponent(); });
    });
    
    await waitFor(() => {
      expect(screen.getByText('Juan Perez')).toBeTruthy();
    });
    
    const editBtn = screen.getByText(/Editar Informaci.n/i);
    fireEvent.click(editBtn);

    const nombresInput = screen.getByLabelText(/Nombres/i) as HTMLInputElement;
    expect(nombresInput.value).toBe('Juan');

    expect(roleGuardMock).toHaveBeenCalledWith(expect.objectContaining({ allowedRoles: ['ADMIN_CLINICA', 'MEDICO', 'RECEPCIONISTA'] }));
    expect(pushMock).not.toHaveBeenCalledWith('/dashboard');
    expect(replaceMock).not.toHaveBeenCalledWith('/dashboard');
  });

  it('MEDICO ve pestaña Historia Clínica, otros roles no', async () => {
    vi.spyOn(pacienteApi, 'getPacienteById').mockResolvedValue({ success: true, message: 'OK', data: mockPaciente });

    // Primero como ADMIN_CLINICA (estado por defecto en beforeEach)
    await act(async () => { await renderComponent(); });
    await waitFor(() => {
      expect(screen.getByText('Juan Perez')).toBeTruthy();
    });
    expect(screen.queryByText(/Historia Cl.nica/i)).toBeNull();

    // Ahora como RECEPCIONISTA
    cleanup();
    useAuthStore.getState().setAuth('token', { id: 1, nombres: 'Test', apellidos: 'User', correo: 'test@test.com', rol: 'RECEPCIONISTA', clinicaId: 1, clinicaNombre: 'Alpha', onboardingCompletado: true });
    await act(async () => { await renderComponent(); });
    await waitFor(() => {
      expect(screen.queryByText(/Historia Cl.nica/i)).toBeNull();
    });

    // SUPER_ADMIN tampoco puede ver contenido clínico desde esta vista.
    cleanup();
    useAuthStore.getState().setAuth('token', { id: 1, nombres: 'Test', apellidos: 'User', correo: 'test@test.com', rol: 'SUPER_ADMIN', clinicaId: 1, clinicaNombre: 'Alpha', onboardingCompletado: true });
    await act(async () => { await renderComponent(); });
    await waitFor(() => {
      expect(screen.queryByText(/Historia Cl.nica/i)).toBeNull();
    });

    // Ahora como MEDICO
    cleanup();
    useAuthStore.getState().setAuth('token', { id: 1, nombres: 'Test', apellidos: 'User', correo: 'test@test.com', rol: 'MEDICO', clinicaId: 1, clinicaNombre: 'Alpha', onboardingCompletado: true });
    await act(async () => { await renderComponent(); });
    await waitFor(() => {
      expect(screen.getByText(/Historia Cl.nica/i)).toBeTruthy();
    });
  });
});




