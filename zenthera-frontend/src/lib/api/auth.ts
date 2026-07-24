import apiClient from '../axios';

export interface ActivationResponse {
  success: boolean;
  message: string;
}

export const activateAccount = async (token: string, password: string): Promise<ActivationResponse> => {
  const response = await apiClient.post<ActivationResponse>('/api/v1/auth/activate', {
    token,
    password,
  });
  return response.data;
};
