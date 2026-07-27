import apiClient from '../axios';
import type { ApiResponse } from './types';

export interface ActivationResponse {
  success: boolean;
  message: string;
}

export interface PublicClinicRegistrationRequest {
  ruc: string;
  razonSocial: string;
  nombre: string;
  correo: string;
  telefono: string;
  adminNombres: string;
  adminApellidos: string;
  adminCedula: string;
  adminCorreo: string;
  password: string;
}

export interface PublicClinicRegistrationResponse {
  adminCorreo: string;
  estado: string;
}

export const activateAccount = async (token: string, password: string): Promise<ActivationResponse> => {
  const response = await apiClient.post<ActivationResponse>('/api/v1/auth/activate', {
    token,
    password,
  });
  return response.data;
};

export const registerClinic = async (
  data: PublicClinicRegistrationRequest
): Promise<PublicClinicRegistrationResponse> => {
  const response = await apiClient.post<ApiResponse<PublicClinicRegistrationResponse>>(
    '/api/v1/auth/register-clinic',
    data
  );

  return response.data.data;
};
