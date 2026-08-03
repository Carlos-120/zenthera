import React from 'react';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import MedicosPage from '../app/dashboard/medicos/page';
import NuevoMedicoPage from '../app/dashboard/medicos/nuevo/page';
import { vi, describe, it, expect, beforeEach, Mock } from 'vitest';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../store/authStore';

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

vi.mock('../store/authStore', () => ({
  useAuthStore: vi.fn(),
}));

vi.mock('../lib/api/medicos', () => ({
  getMedicos: vi.fn(),
  updateMedicoStatus: vi.fn(),
  createMedico: vi.fn(),
}));

vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-query')>();
  return {
    ...actual,
    useQuery: vi.fn(),
    useMutation: vi.fn(),
    useQueryClient: vi.fn(() => ({
      invalidateQueries: vi.fn(),
    })),
  };
});

describe('Doctors Management', () => {
  const mockPush = vi.fn();
  const mockReplace = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as Mock).mockReturnValue({ push: mockPush, replace: mockReplace });
    (useAuthStore as unknown as Mock).mockImplementation((selector) => {
      const state = {
        usuario: { rol: 'ADMIN_CLINICA' },
        isAuthenticated: true
      };
      return selector ? selector(state) : state;
    });
  });

  describe('MedicosPage', () => {
    it('renders list of doctors successfully', () => {
      (useQuery as Mock).mockReturnValue({
        data: {
          data: {
            content: [
              {
                id: 1,
                cedula: '1712345678',
                nombres: 'Juan',
                apellidos: 'Perez',
                especialidad: 'Cardiología',
                activo: true
              }
            ],
            totalPages: 1
          }
        },
        isLoading: false,
        error: null,
      });

      (useMutation as Mock).mockReturnValue({
        mutate: vi.fn(),
        isPending: false
      });

      render(<MedicosPage />);
      expect(screen.getByText('Juan Perez')).toBeInTheDocument();
      expect(screen.getByText('Cardiología')).toBeInTheDocument();
      expect(screen.getByText('Desactivar')).toBeInTheDocument();
    });

    it('renders empty state when no doctors found', () => {
      (useQuery as Mock).mockReturnValue({
        data: {
          data: {
            content: [],
            totalPages: 0
          }
        },
        isLoading: false,
        error: null,
      });

      (useMutation as Mock).mockReturnValue({ mutate: vi.fn() });

      render(<MedicosPage />);
      expect(screen.getByText('No se encontraron médicos')).toBeInTheDocument();
    });
  });

  describe('NuevoMedicoPage', () => {
    it('renders the registration form', () => {
      (useMutation as Mock).mockReturnValue({
        mutate: vi.fn(),
        isPending: false
      });
      render(<NuevoMedicoPage />);
      expect(screen.getByLabelText(/Cédula \/ Identificación/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Nombres/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Apellidos/i)).toBeInTheDocument();
    });
  });
});
