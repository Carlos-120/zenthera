import apiClient from '@/lib/axios';

export interface ClinicaResponse {
  id: number;
  nombre: string;
  razonSocial?: string;
  ruc?: string;
  correo: string;
  telefono?: string;
  direccion?: string;
  ciudad?: string;
  provincia?: string;
  pais: string;
  zonaHoraria: string;
  onboardingCompletado: boolean;
  onboardingCompletadoEn?: string;
  logo?: string;
}

export interface ClinicOnboardingRequest {
  ruc: string;
  razonSocial: string;
  correo: string;
  telefono: string;
  direccion: string;
  ciudad: string;
  provincia: string;
}

export const getClinica = async (): Promise<ClinicaResponse> => {
  const response = await apiClient.get('/api/v1/clinica');
  return response.data.data;
};

export const completeOnboarding = async (data: ClinicOnboardingRequest): Promise<ClinicaResponse> => {
  const response = await apiClient.put('/api/v1/clinica/onboarding', data);
  return response.data.data;
};
