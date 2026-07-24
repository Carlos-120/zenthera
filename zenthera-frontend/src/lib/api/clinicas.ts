import apiClient from '../axios';
import { ApiResponse, PageResponse } from './types';

// Tipos de las Clínicas
export interface ClinicaResponse {
  id: number;
  nombre: string;
  razonSocial: string;
  ruc: string;
  telefono: string;
  correo: string;
  direccion: string | null;
  ciudad: string | null;
  provincia: string | null;
  pais: string | null;
  zonaHoraria: string;
  logo: string | null;
  activa: boolean;
}

export interface ClinicaUpdateRequest {
  nombre: string;
  logo?: string;
  telefono: string;
  correo: string;
  direccion: string;
  ciudad?: string;
  provincia?: string;
  pais?: string;
  zonaHoraria: string;
}

export interface ClinicaCreateRequest {
  ruc: string;
  razonSocial: string;
  nombre: string;
  correo: string;
  telefono: string;
  adminNombres: string;
  adminApellidos: string;
  adminCedula: string;
  adminCorreo: string;
}

export interface ClinicaEstadoRequest {
  activa: boolean;
  motivo: string;
}

// Endpoints para ADMIN_CLINICA
export const getMiClinica = async (): Promise<ApiResponse<ClinicaResponse>> => {
  const response = await apiClient.get<ApiResponse<ClinicaResponse>>('/api/v1/clinica');
  return response.data;
};

export const updateMiClinica = async (data: ClinicaUpdateRequest): Promise<ApiResponse<ClinicaResponse>> => {
  const response = await apiClient.put<ApiResponse<ClinicaResponse>>('/api/v1/clinica', data);
  return response.data;
};

// Endpoints para SUPER_ADMIN
export const getAllClinicas = async (params: { search?: string; page: number; size: number }): Promise<ApiResponse<PageResponse<ClinicaResponse>>> => {
  const response = await apiClient.get<ApiResponse<PageResponse<ClinicaResponse>>>('/api/v1/admin/clinicas', { params });
  return response.data;
};

export const getClinicaById = async (id: number): Promise<ApiResponse<ClinicaResponse>> => {
  const response = await apiClient.get<ApiResponse<ClinicaResponse>>(`/api/v1/admin/clinicas/${id}`);
  return response.data;
};

export const createClinica = async (data: ClinicaCreateRequest): Promise<ApiResponse<ClinicaResponse>> => {
  const response = await apiClient.post<ApiResponse<ClinicaResponse>>('/api/v1/admin/clinicas', data);
  return response.data;
};

export const updateEstadoClinica = async (id: number, data: ClinicaEstadoRequest): Promise<ApiResponse<ClinicaResponse>> => {
  const response = await apiClient.patch<ApiResponse<ClinicaResponse>>(`/api/v1/admin/clinicas/${id}/estado`, data);
  return response.data;
};
