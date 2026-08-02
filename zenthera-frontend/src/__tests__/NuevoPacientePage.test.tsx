import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import NuevoPacientePage from '../app/dashboard/pacientes/nuevo/page';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createPaciente } from '../lib/api/pacientes';
import { useAuthStore } from '../store/authStore';

const mockPush = vi.fn();

vi.mock('../lib/api/pacientes', () => ({
  createPaciente: vi.fn(),
}));

vi.mock('../store/authStore', () => ({
  useAuthStore: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe('NuevoPacientePage', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    (useAuthStore as unknown as Mock).mockImplementation((selector) => {
      const state = { usuario: { rol: 'ADMIN_CLINICA' } };
      return selector ? selector(state) : state;
    });
    vi.clearAllMocks();
  });

  const renderComponent = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <NuevoPacientePage />
      </QueryClientProvider>
    );
  };

  it('POST 201 redirige a /dashboard/pacientes y no a /dashboard/pacientes/{id}', async () => {
    (createPaciente as Mock).mockResolvedValue({
      data: { id: 123 }
    });

    renderComponent();

    fireEvent.change(screen.getByLabelText(/Nombres/i), { target: { value: 'Test' } });
    fireEvent.change(screen.getByLabelText(/Apellidos/i), { target: { value: 'User' } });
    fireEvent.change(screen.getByLabelText(/Cédula/i), { target: { value: '0999999999' } });
    fireEvent.change(screen.getByLabelText(/Fecha de nacimiento/i), { target: { value: '1990-01-01' } });
    fireEvent.change(screen.getByRole('combobox', { name: /Sexo/i }), { target: { value: 'MASCULINO' } });

    fireEvent.click(screen.getByRole('button', { name: /Crear Paciente/i }));

    await waitFor(() => {
      expect(createPaciente).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith('/dashboard/pacientes');
      expect(mockPush).not.toHaveBeenCalledWith('/dashboard/pacientes/123');
    });
  });
});
