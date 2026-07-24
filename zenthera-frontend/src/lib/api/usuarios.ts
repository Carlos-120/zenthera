import apiClient from '../axios';
import { ApiResponse, PageResponse } from './types';

export interface UsuarioResponse {
  id: number;
  clinicaId: number;
  nombreClinica: string;
  rolId: number;
  nombreRol: string;
  nombres: string;
  apellidos: string;
  cedula: string;
  telefono: string;
  correo: string;
  foto: string | null;
  activo: boolean;
  bloqueado: boolean;
  cambiarPassword: boolean;
  ultimoLogin: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RolResponse {
  id: number;
  nombre: string;
}

export interface UsuarioRequest {
  rolId: number;
  nombres: string;
  apellidos: string;
  cedula: string;
  telefono?: string;
  correo: string;
  password?: string;
  foto?: string;
}

export interface EstadoUsuarioRequest {
  activo: boolean;
}

export interface GetUsuariosParams {
  page?: number;
  size?: number;
  search?: string;
  activo?: boolean;
  rolId?: number;
  sort?: string;
}

export const getUsuarios = async (params: GetUsuariosParams): Promise<ApiResponse<PageResponse<UsuarioResponse>>> => {
  // Eliminar parámetros undefined para que axios no los envíe vacíos o "undefined"
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(([_, v]) => v !== undefined && v !== '')
  );

  const response = await apiClient.get<ApiResponse<PageResponse<UsuarioResponse>>>('/api/v1/clinica/usuarios', {
    params: cleanParams
  });
  return response.data;
};

export const getRolesAsignables = async (): Promise<ApiResponse<RolResponse[]>> => {
  const response = await apiClient.get<ApiResponse<RolResponse[]>>('/api/v1/clinica/roles');
  return response.data;
};

export const getUsuarioById = async (id: number): Promise<ApiResponse<UsuarioResponse>> => {
  const response = await apiClient.get<ApiResponse<UsuarioResponse>>(`/api/v1/clinica/usuarios/${id}`);
  return response.data;
};

export const createUsuario = async (data: UsuarioRequest): Promise<ApiResponse<UsuarioResponse>> => {
  const response = await apiClient.post<ApiResponse<UsuarioResponse>>('/api/v1/clinica/usuarios', data);
  return response.data;
};

export const updateUsuario = async (id: number, data: UsuarioRequest): Promise<ApiResponse<UsuarioResponse>> => {
  const response = await apiClient.put<ApiResponse<UsuarioResponse>>(`/api/v1/clinica/usuarios/${id}`, data);
  return response.data;
};

export const updateEstadoUsuario = async (id: number, data: EstadoUsuarioRequest): Promise<ApiResponse<UsuarioResponse>> => {
  const response = await apiClient.patch<ApiResponse<UsuarioResponse>>(`/api/v1/clinica/usuarios/${id}/estado`, data);
  return response.data;
};
