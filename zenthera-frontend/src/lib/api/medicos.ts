import apiClient from '../axios';
import { ApiResponse, PageResponse } from './types';

export interface MedicoResponse {
  id: number;
  cedula: string;
  nombres: string;
  apellidos: string;
  especialidad: string;
  registroProfesional?: string;
  telefono?: string;
  correo: string;
  direccion?: string;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MedicoRequest {
  cedula: string;
  nombres: string;
  apellidos: string;
  especialidad: string;
  registroProfesional?: string;
  telefono?: string;
  correo: string;
  direccion?: string;
  activo: boolean;
}

export interface GetMedicosParams {
  page?: number;
  size?: number;
  search?: string;
  activo?: boolean;
  sort?: string;
}

export const getMedicos = async (params: GetMedicosParams): Promise<ApiResponse<PageResponse<MedicoResponse>>> => {
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(([_, v]) => v !== undefined && v !== '')
  );

  const response = await apiClient.get<ApiResponse<PageResponse<MedicoResponse>>>('/api/medicos/paginado', {
    params: cleanParams
  });
  return response.data;
};

export const getMedicoById = async (id: number): Promise<ApiResponse<MedicoResponse>> => {
  const response = await apiClient.get<ApiResponse<MedicoResponse>>(`/api/medicos/${id}`);
  return response.data;
};

export const createMedico = async (data: MedicoRequest): Promise<ApiResponse<MedicoResponse>> => {
  const response = await apiClient.post<ApiResponse<MedicoResponse>>('/api/medicos', data);
  return response.data;
};

export const updateMedicoStatus = async ({ id, activo }: { id: number; activo: boolean }): Promise<ApiResponse<MedicoResponse>> => {
  const response = await apiClient.patch<ApiResponse<MedicoResponse>>(`/api/medicos/${id}/estado`, null, {
    params: { activo }
  });
  return response.data;
};
