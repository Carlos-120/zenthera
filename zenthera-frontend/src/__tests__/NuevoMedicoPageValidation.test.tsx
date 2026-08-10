import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import NuevoMedicoPage from '../app/dashboard/medicos/nuevo/page';
import { vi, describe, it, expect, beforeEach, Mock } from 'vitest';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../store/authStore';

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

vi.mock('../store/authStore', () => ({
  useAuthStore: vi.fn(),
}));

vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-query')>();
  return {
    ...actual,
    useMutation: vi.fn(),
    useQueryClient: vi.fn(() => ({
      invalidateQueries: vi.fn(),
    })),
  };
});

describe('NuevoMedicoPage Validation', () => {
  const mockPush = vi.fn();
  let mockMutate: Mock;

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as Mock).mockReturnValue({ push: mockPush });
    (useAuthStore as unknown as Mock).mockImplementation((selector) => {
      const state = { usuario: { rol: 'ADMIN_CLINICA' }, isAuthenticated: true };
      return selector ? selector(state) : state;
    });

    mockMutate = vi.fn();
    (useMutation as Mock).mockReturnValue({
      mutate: mockMutate,
      isPending: false,
    });
  });

  const fillForm = (data: Record<string, unknown>) => {
    if (data.cedula) fireEvent.change(screen.getByLabelText(/Cédula/i), { target: { value: data.cedula } });
    if (data.nombres) fireEvent.change(screen.getByLabelText(/Nombres/i), { target: { value: data.nombres } });
    if (data.apellidos) fireEvent.change(screen.getByLabelText(/Apellidos/i), { target: { value: data.apellidos } });
    if (data.especialidad) fireEvent.change(screen.getByLabelText(/Especialidad/i), { target: { value: data.especialidad } });
    if (data.correo) fireEvent.change(screen.getByLabelText(/Correo Electrónico/i), { target: { value: data.correo } });
    
    if (data.crearCuentaAcceso !== undefined) {
      const checkbox = screen.getByRole('checkbox', { name: /Crear cuenta de acceso/i });
      if (data.crearCuentaAcceso && !(checkbox as HTMLInputElement).checked) fireEvent.click(checkbox);
      if (!data.crearCuentaAcceso && (checkbox as HTMLInputElement).checked) fireEvent.click(checkbox);
    }

    if (data.password) fireEvent.change(screen.getByLabelText(/^Contraseña Temporal/i), { target: { value: data.password } });
    if (data.confirmPassword) fireEvent.change(screen.getByLabelText(/^Confirmar Contraseña/i), { target: { value: data.confirmPassword } });
  };

  const submitForm = () => {
    fireEvent.click(screen.getByRole('button', { name: /Registrar Médico/i }));
  };

  it('1. cédula requerida', async () => {
    render(<NuevoMedicoPage />);
    submitForm();
    expect(await screen.findByText(/La cédula debe tener al menos 10 caracteres/i)).toBeInTheDocument();
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it('2. cédula con caracteres inválidos muestra error', async () => {
    render(<NuevoMedicoPage />);
    fillForm({ cedula: 'ABC1234567' });
    submitForm();
    expect(await screen.findByText(/La cédula solo puede contener números/i)).toBeInTheDocument();
  });

  it('3. nombres requeridos', async () => {
    render(<NuevoMedicoPage />);
    submitForm();
    expect(await screen.findByText(/Los nombres son obligatorios/i)).toBeInTheDocument();
  });

  it('4. apellidos requeridos', async () => {
    render(<NuevoMedicoPage />);
    submitForm();
    expect(await screen.findByText(/Los apellidos son obligatorios/i)).toBeInTheDocument();
  });

  it('5. especialidad requerida', async () => {
    render(<NuevoMedicoPage />);
    submitForm();
    expect(await screen.findByText(/La especialidad es obligatoria/i)).toBeInTheDocument();
  });

  it('6. correo inválido muestra error si se crea cuenta', async () => {
    render(<NuevoMedicoPage />);
    // Just submit empty form. Since crearCuentaAcceso is true by default, 
    // it will validate correo and throw "Correo inválido"
    submitForm();
    await waitFor(() => {
      expect(screen.getByText(/Correo inválido/i)).toBeInTheDocument();
    });
  });

  it('7. contraseña requerida si se crea cuenta', async () => {
    render(<NuevoMedicoPage />);
    fillForm({ crearCuentaAcceso: true });
    submitForm();
    expect(await screen.findByText(/La contraseña debe tener entre 12 y 72 caracteres/i)).toBeInTheDocument();
  });

  it('8. política de password mostrada correctamente', async () => {
    render(<NuevoMedicoPage />);
    fillForm({ crearCuentaAcceso: true, password: 'short' });
    submitForm();
    expect(await screen.findByText(/La contraseña debe tener entre 12 y 72 caracteres/i)).toBeInTheDocument();
  });

  it('9. confirmPassword diferente muestra error', async () => {
    render(<NuevoMedicoPage />);
    fillForm({ 
      crearCuentaAcceso: true, 
      password: 'password12345', 
      confirmPassword: 'differentpassword' 
    });
    submitForm();
    expect(await screen.findByText(/Las contraseñas no coinciden/i)).toBeInTheDocument();
  });

  it('10. formulario inválido NO llama POST /api/medicos', async () => {
    render(<NuevoMedicoPage />);
    fillForm({ cedula: '123' }); // Invalid
    submitForm();
    await waitFor(() => {
        expect(screen.queryByText(/La cédula debe tener al menos 10 caracteres/i)).toBeInTheDocument();
    });
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it('11. error backend de cédula duplicada se muestra correctamente', async () => {
    let onErrorCb: (error: unknown) => void = () => {};
    (useMutation as Mock).mockImplementation(({ onError }) => {
      onErrorCb = onError;
      return { mutate: mockMutate, isPending: false };
    });

    render(<NuevoMedicoPage />);
    
    // Simulate backend error response
    if (onErrorCb) {
      onErrorCb({
        response: {
          data: {
            success: false,
            message: 'Error de validación',
            errors: ['cedula: Ya existe un médico con esta identificación.']
          }
        }
      });
    }

    expect(await screen.findByText(/Ya existe un médico con esta identificación/i)).toBeInTheDocument();
  });

  it('12. error backend de correo duplicado se muestra correctamente', async () => {
    let onErrorCb: (error: unknown) => void = () => {};
    (useMutation as Mock).mockImplementation(({ onError }) => {
      onErrorCb = onError;
      return { mutate: mockMutate, isPending: false };
    });

    render(<NuevoMedicoPage />);
    
    if (onErrorCb) {
      onErrorCb({
        response: {
          data: {
            success: false,
            message: 'Error de validación',
            errors: ['correo: Ya existe una cuenta con este correo.']
          }
        }
      });
    }

    expect(await screen.findByText(/Ya existe una cuenta con este correo/i)).toBeInTheDocument();
  });

  it('13. request válido funciona, 14. no envía clinicaId, 15. no envía rol', async () => {
    render(<NuevoMedicoPage />);
    
    fillForm({
      cedula: '1712345678',
      nombres: 'Juan',
      apellidos: 'Pérez',
      especialidad: 'Cardiología',
      correo: 'juan@test.com',
      crearCuentaAcceso: true,
      password: 'password12345',
      confirmPassword: 'password12345'
    });

    submitForm();

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith(expect.objectContaining({
        cedula: '1712345678',
        nombres: 'Juan',
        apellidos: 'Pérez',
        especialidad: 'Cardiología',
        correo: 'juan@test.com',
        crearCuentaAcceso: true,
        password: 'password12345',
        confirmPassword: 'password12345'
      }));
    });

    const callArg = mockMutate.mock.calls[0][0];
    expect(callArg).not.toHaveProperty('clinicaId');
    expect(callArg).not.toHaveProperty('rol');
  });

  it('16. no existe password si crearCuentaAcceso=false', async () => {
    render(<NuevoMedicoPage />);
    
    fillForm({
      cedula: '1712345678',
      nombres: 'Juan',
      apellidos: 'Pérez',
      especialidad: 'Cardiología',
      correo: 'juan@test.com',
      crearCuentaAcceso: false
    });

    submitForm();

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalled();
    });

    const callArg = mockMutate.mock.calls[0][0];
    expect(callArg.crearCuentaAcceso).toBe(false);
    expect(callArg.password).toBeUndefined();
    expect(callArg.confirmPassword).toBeUndefined();
  });
});
