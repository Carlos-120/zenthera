import axios, { AxiosError } from 'axios';
import { ApiResponse } from './types';

/**
 * Transforma cualquier error capturado en una llamada a la API
 * a un formato consistente (string o array de strings) para mostrar al usuario.
 */
export const handleApiError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiResponse<any>>;

    // Si el backend devolvió el formato esperado (ApiResponse)
    if (axiosError.response?.data) {
      const data = axiosError.response.data;

      // Si hay un arreglo de errores de validación
      if (data.errors && data.errors.length > 0) {
        return data.errors.join(', ');
      }

      // Si hay un mensaje descriptivo
      if (data.message) {
        return data.message;
      }
    }

    // Si es un error de red o timeout sin respuesta
    if (axiosError.request) {
      return 'Error de conexión con el servidor. Por favor, revisa tu conexión e intenta de nuevo.';
    }

    return axiosError.message;
  }

  // Si no es un error de Axios
  if (error instanceof Error) {
    return error.message;
  }

  return 'Ocurrió un error inesperado.';
};
