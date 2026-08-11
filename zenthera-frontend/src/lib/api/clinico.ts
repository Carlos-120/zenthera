import api from '@/lib/axios';

export interface SignosVitalesDto {
  peso?: number | null;
  talla?: number | null;
  presionSistolica?: number | null;
  presionDiastolica?: number | null;
  frecuenciaCardiaca?: number | null;
  temperatura?: number | null;
  saturacionOxigeno?: number | null;
}

export interface ConsultaRequest {
  motivoConsulta?: string;
  sintomasObservaciones?: string;
  signosVitales?: SignosVitalesDto;
  diagnosticoInicial?: string;
  tratamientoIndicaciones?: string;
  notas?: string;
}

export interface ConsultaResponse {
  id: number;
  historiaClinicaId: number;
  medicoId: number;
  medicoNombres: string;
  medicoApellidos: string;
  estado: 'BORRADOR' | 'FINALIZADA';
  motivoConsulta?: string;
  sintomasObservaciones?: string;
  signosVitales?: SignosVitalesDto;
  diagnosticoInicial?: string;
  tratamientoIndicaciones?: string;
  notas?: string;
  finalizadaAt?: string;
  finalizadaPor?: number;
  createdAt: string;
  updatedAt: string;
}

export interface HistoriaClinicaResponse {
  id: number;
  pacienteId: number;
  createdAt: string;
  updatedAt: string;
  consultas: ConsultaResponse[];
}

export const getHistoriaClinica = (pacienteId: number) => {
  return api.get<HistoriaClinicaResponse>(`/api/v1/pacientes/${pacienteId}/historia`);
};

export const createConsulta = (pacienteId: number, data: ConsultaRequest) => {
  return api.post<ConsultaResponse>(`/api/v1/pacientes/${pacienteId}/consultas`, data);
};

export const getConsulta = (consultaId: number) => {
  return api.get<ConsultaResponse>(`/api/v1/consultas/${consultaId}`);
};

export const updateConsulta = (consultaId: number, data: ConsultaRequest) => {
  return api.put<ConsultaResponse>(`/api/v1/consultas/${consultaId}`, data);
};

export const finalizarConsulta = (consultaId: number) => {
  return api.post<ConsultaResponse>(`/api/v1/consultas/${consultaId}/finalizar`);
};
