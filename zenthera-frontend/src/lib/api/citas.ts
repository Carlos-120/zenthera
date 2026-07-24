import apiClient from '../axios';
import { ApiResponse, PageResponse } from './types';

export type EstadoCita = 'PROGRAMADA' | 'CONFIRMADA' | 'EN_ATENCION' | 'COMPLETADA' | 'CANCELADA' | 'NO_ASISTIO';

export interface ResumenPersona {
  id: number;
  nombres: string;
  apellidos: string;
}

export interface CitaListResponse {
  id: number;
  paciente: ResumenPersona;
  medico: ResumenPersona;
  fechaHoraInicio: string; // ISO 8601 string in UTC
  fechaHoraFin: string;
  duracionMinutos: number;
  estado: EstadoCita;
  motivo: string;
  createdAt: string;
}

export interface CitaResponse extends CitaListResponse {
  observaciones?: string;
  motivoCancelacion?: string;
  updatedAt: string;
}

export interface GetCitasParams {
  page?: number;
  size?: number;
  search?: string;
  pacienteId?: number;
  medicoId?: number;
  estado?: EstadoCita | '';
  fechaDesde?: string; // ISO 8601 UTC
  fechaHasta?: string; // ISO 8601 UTC
  sort?: string;
  direction?: 'asc' | 'desc';
}

export const getCitas = async (params: GetCitasParams): Promise<ApiResponse<PageResponse<CitaListResponse>>> => {
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(([_, v]) => v !== undefined && v !== '')
  );

  const response = await apiClient.get<ApiResponse<PageResponse<CitaListResponse>>>('/api/v1/clinica/citas', {
    params: cleanParams
  });
  return response.data;
};

export const getCitaById = async (id: number): Promise<ApiResponse<CitaResponse>> => {
  const response = await apiClient.get<ApiResponse<CitaResponse>>(`/api/v1/clinica/citas/${id}`);
  return response.data;
};

export interface CitaCreateRequest {
  pacienteId: number;
  medicoId: number;
  fechaHoraInicio: string; // ISO 8601 UTC
  duracionMinutos: number;
  motivo: string;
  observaciones?: string | null;
}

export interface CitaUpdateRequest {
  pacienteId: number;
  medicoId: number;
  fechaHoraInicio: string; // ISO 8601 UTC
  duracionMinutos: number;
  motivo: string;
  observaciones?: string | null;
}

export interface EstadoCitaRequest {
  estado: EstadoCita;
  motivoCancelacion?: string | null;
}

export const createCita = async (data: CitaCreateRequest): Promise<ApiResponse<CitaResponse>> => {
  const response = await apiClient.post<ApiResponse<CitaResponse>>('/api/v1/clinica/citas', data);
  return response.data;
};

export const updateCita = async (id: number, data: CitaUpdateRequest): Promise<ApiResponse<CitaResponse>> => {
  const response = await apiClient.put<ApiResponse<CitaResponse>>(`/api/v1/clinica/citas/${id}`, data);
  return response.data;
};

export const updateEstadoCita = async (id: number, data: EstadoCitaRequest): Promise<ApiResponse<CitaResponse>> => {
  const response = await apiClient.patch<ApiResponse<CitaResponse>>(`/api/v1/clinica/citas/${id}/estado`, data);
  return response.data;
};
