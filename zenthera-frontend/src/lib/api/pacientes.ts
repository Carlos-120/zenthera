import apiClient from '../axios';
import { ApiResponse, PageResponse } from './types';

export interface PacienteResponse {
  id: number;
  cedula: string;
  nombres: string;
  apellidos: string;
  fechaNacimiento: string;
  sexo: 'FEMENINO' | 'MASCULINO' | 'OTRO';
  telefono?: string;
  correo?: string;
  direccion?: string;
  tipoSangre?: string;
  alergias?: string;
  contactoEmergencia?: string;
  telefonoEmergencia?: string;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GetPacientesParams {
  page?: number;
  size?: number;
  search?: string;
  activo?: boolean;
  sort?: string;
  direction?: string;
}

export const getPacientes = async (params: GetPacientesParams): Promise<ApiResponse<PageResponse<PacienteResponse>>> => {
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== '')
  );

  try {
    const response = await apiClient.get<ApiResponse<PageResponse<PacienteResponse>>>('/api/pacientes/paginado', {
      params: cleanParams
    });
    return response.data;
  } catch (error) {
    const err = error as { response?: { data?: { message?: string } } };
    throw new Error(err.response?.data?.message || 'Error al obtener pacientes');
  }
};

export const getPacienteById = async (id: number): Promise<ApiResponse<PacienteResponse>> => {
  const response = await apiClient.get<ApiResponse<PacienteResponse>>(`/api/pacientes/${id}`);
  return response.data;
};

export interface EstadoPacienteRequest {
  activo: boolean;
}

export const createPaciente = async (data: unknown): Promise<ApiResponse<PacienteResponse>> => {
  const response = await apiClient.post<ApiResponse<PacienteResponse>>('/api/pacientes', data);
  return response.data;
};

export const updatePaciente = async (id: number, data: unknown): Promise<ApiResponse<PacienteResponse>> => {
  const response = await apiClient.put<ApiResponse<PacienteResponse>>(`/api/pacientes/${id}`, data);
  return response.data;
};

export const updateEstadoPaciente = async (id: number, data: EstadoPacienteRequest): Promise<ApiResponse<PacienteResponse>> => {
  const response = await apiClient.patch<ApiResponse<PacienteResponse>>(`/api/pacientes/${id}/estado`, data);
  return response.data;
};
