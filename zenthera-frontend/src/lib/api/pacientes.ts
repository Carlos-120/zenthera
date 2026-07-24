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

export interface PacienteListResponse extends PacienteResponse {}

export interface GetPacientesParams {
  page?: number;
  size?: number;
  search?: string;
  activo?: boolean;
  sort?: string;
}

export const getPacientes = async (params: GetPacientesParams): Promise<ApiResponse<PageResponse<PacienteListResponse>>> => {
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(([_, v]) => v !== undefined && v !== '')
  );

  const response = await apiClient.get<ApiResponse<PageResponse<PacienteListResponse>>>('/api/pacientes/paginado', {
    params: cleanParams
  });
  return response.data;
};

export const getPacienteById = async (id: number): Promise<ApiResponse<PacienteResponse>> => {
  const response = await apiClient.get<ApiResponse<PacienteResponse>>(`/api/pacientes/${id}`);
  return response.data;
};

export interface EstadoPacienteRequest {
  activo: boolean;
}

export const createPaciente = async (data: any): Promise<ApiResponse<PacienteResponse>> => {
  const response = await apiClient.post<ApiResponse<PacienteResponse>>('/api/v1/clinica/pacientes', data);
  return response.data;
};

export const updatePaciente = async (id: number, data: any): Promise<ApiResponse<PacienteResponse>> => {
  const response = await apiClient.put<ApiResponse<PacienteResponse>>(`/api/v1/clinica/pacientes/${id}`, data);
  return response.data;
};

export const updateEstadoPaciente = async (id: number, data: EstadoPacienteRequest): Promise<ApiResponse<PacienteResponse>> => {
  const response = await apiClient.patch<ApiResponse<PacienteResponse>>(`/api/v1/clinica/pacientes/${id}/estado`, data);
  return response.data;
};
