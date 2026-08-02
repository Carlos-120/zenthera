import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import PacientesPage from '../app/dashboard/pacientes/page';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { getPacientes } from '../lib/api/pacientes';
import { useAuthStore } from '../store/authStore';

// Mock dependencies
vi.mock('../lib/api/pacientes', () => ({
  getPacientes: vi.fn(),
  updateEstadoPaciente: vi.fn(),
}));

vi.mock('../store/authStore', () => ({
  useAuthStore: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
  usePathname: () => '/dashboard/pacientes',
}));

vi.mock('next/link', () => {
  return {
    default: ({ children, href }: { children: React.ReactNode; href: string }) => {
      return <a href={href}>{children}</a>;
    }
  };
});

describe('PacientesPage', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
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
        <PacientesPage />
      </QueryClientProvider>
    );
  };

  it('renders loading state initially', () => {
    (getPacientes as Mock).mockImplementation(() => new Promise(() => {}));
    
    renderComponent();
    
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders empty state when no patients found', async () => {
    (getPacientes as Mock).mockResolvedValue({
      data: {
        content: [],
        totalElements: 0,
        totalPages: 0,
      }
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/no se encontraron pacientes/i)).toBeInTheDocument();
    });
  });

  it('renders patients list successfully and handles null dates', async () => {
    (getPacientes as Mock).mockResolvedValue({
      data: {
        content: [
          {
            id: 1,
            cedula: '1234567890',
            nombres: 'Juan',
            apellidos: 'Pérez',
            fechaNacimiento: null,
            correo: 'juan@example.com',
            telefono: '0999999999',
            activo: true,
            createdAt: null,
          },
          {
            id: 2,
            cedula: '0987654321',
            nombres: 'Ana',
            apellidos: 'López',
            fechaNacimiento: 'invalid-date',
            correo: 'ana@example.com',
            telefono: '0988888888',
            activo: true,
            createdAt: 'invalid-date',
          }
        ],
        totalElements: 2,
        totalPages: 1,
      }
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
      expect(screen.getByText('Ana López')).toBeInTheDocument();
    });

    // Validamos que NO renderiza NaN ni Invalid Date
    const bodyText = document.body.textContent;
    expect(bodyText).not.toMatch(/NaN/i);
    expect(bodyText).not.toMatch(/Invalid Date/i);
    expect(bodyText).not.toMatch(/Error al cargar/i);

    // Verificamos que los guiones existen para los datos faltantes
    const dashes = screen.getAllByText('—');
    expect(dashes.length).toBeGreaterThanOrEqual(4); // 2 pacientes * 2 campos nulos/invalidos
  });

  it('handles search input', async () => {
    (getPacientes as Mock).mockResolvedValue({
      data: { content: [], totalElements: 0, totalPages: 0 }
    });

    renderComponent();

    const searchInput = screen.getByPlaceholderText(/Buscar por/i);
    fireEvent.change(searchInput, { target: { value: 'Juan' } });

    await waitFor(() => {
      expect(getPacientes).toHaveBeenCalledWith(expect.objectContaining({
        search: 'Juan'
      }));
    });
  });
});
