'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { AlertCircle } from 'lucide-react';
import { getClinica, completeOnboarding, ClinicOnboardingRequest } from '@/services/clinicaService';
import apiClient from '@/lib/axios';
import { useAuthStore } from '@/store/authStore';

export default function ConfiguracionInicialPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const accessToken = useAuthStore((state) => state.accessToken);

  const [formData, setFormData] = useState<ClinicOnboardingRequest>({
    ruc: '',
    razonSocial: '',
    correo: '',
    telefono: '',
    direccion: '',
    ciudad: '',
    provincia: '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof ClinicOnboardingRequest, string>>>({});
  const [globalError, setGlobalError] = useState('');

  const { data: clinicaData, isLoading } = useQuery({
    queryKey: ['clinica'],
    queryFn: getClinica,
  });

  useEffect(() => {
    if (clinicaData) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData((prev) => ({
        ...prev,
        ruc: clinicaData.ruc || '',
        razonSocial: clinicaData.razonSocial || clinicaData.nombre || '',
        correo: clinicaData.correo || '',
        telefono: clinicaData.telefono || '',
        direccion: clinicaData.direccion || '',
        ciudad: clinicaData.ciudad || '',
        provincia: clinicaData.provincia || '',
      }));
    }
  }, [clinicaData]);

  const validate = () => {
    const newErrors: Partial<Record<keyof ClinicOnboardingRequest, string>> = {};
    const rucRegex = /^\d{13}$/;
    const phoneRegex = /^\d+$/;
    const noNumberRegex = /^[^\d]+$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.ruc || !rucRegex.test(formData.ruc)) newErrors.ruc = 'RUC debe tener 13 dígitos numéricos';
    if (!formData.razonSocial.trim()) newErrors.razonSocial = 'Razón social es requerida';
    if (!formData.correo || !emailRegex.test(formData.correo)) newErrors.correo = 'Correo institucional inválido';
    if (!formData.telefono || !phoneRegex.test(formData.telefono)) newErrors.telefono = 'Teléfono debe ser numérico';
    if (!formData.direccion.trim()) newErrors.direccion = 'Dirección es requerida';
    if (!formData.ciudad || !noNumberRegex.test(formData.ciudad)) newErrors.ciudad = 'Ciudad no debe contener números';
    if (!formData.provincia || !noNumberRegex.test(formData.provincia)) newErrors.provincia = 'Provincia no debe contener números';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const mutation = useMutation({
    mutationFn: completeOnboarding,
    onSuccess: async () => {
      try {
        if (accessToken) {
          const resMe = await apiClient.get('/api/v1/auth/me', {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          setAuth(accessToken, resMe.data.data);
          router.push('/dashboard');
        }
      } catch {
        setGlobalError('Error actualizando sesión');
      }
    },
    onError: (error: Error | unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      setGlobalError(err?.response?.data?.message || 'Ocurrió un error al guardar la configuración');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError('');
    if (validate()) {
      mutation.mutate(formData);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof ClinicOnboardingRequest]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-xl">
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-foreground">
          Configuración Inicial
        </h2>
        <p className="mt-2 text-center text-sm text-foreground-muted">
          Completa los datos de tu clínica para comenzar
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-surface py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-border">
          {globalError && (
            <div role="alert" className="mb-6 p-4 rounded-lg bg-error/10 border border-error/20 flex items-center text-error text-sm">
              <AlertCircle className="w-5 h-5 mr-3 shrink-0" />
              <p>{globalError}</p>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="razonSocial" className="block text-sm font-medium text-foreground/80 mb-1">
                  Razón Social
                </label>
                <input
                  id="razonSocial"
                  name="razonSocial"
                  type="text"
                  value={formData.razonSocial}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 rounded-xl border ${errors.razonSocial ? 'border-error' : 'border-border'} bg-surface/50 focus:bg-surface focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all duration-200 text-foreground`}
                />
                {errors.razonSocial && <p className="mt-1 text-sm text-error">{errors.razonSocial}</p>}
              </div>

              <div>
                <label htmlFor="ruc" className="block text-sm font-medium text-foreground/80 mb-1">
                  RUC
                </label>
                <input
                  id="ruc"
                  name="ruc"
                  type="text"
                  value={formData.ruc}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 rounded-xl border ${errors.ruc ? 'border-error' : 'border-border'} bg-surface/50 focus:bg-surface focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all duration-200 text-foreground`}
                />
                {errors.ruc && <p className="mt-1 text-sm text-error">{errors.ruc}</p>}
              </div>

              <div>
                <label htmlFor="telefono" className="block text-sm font-medium text-foreground/80 mb-1">
                  Teléfono Institucional
                </label>
                <input
                  id="telefono"
                  name="telefono"
                  type="text"
                  value={formData.telefono}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 rounded-xl border ${errors.telefono ? 'border-error' : 'border-border'} bg-surface/50 focus:bg-surface focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all duration-200 text-foreground`}
                />
                {errors.telefono && <p className="mt-1 text-sm text-error">{errors.telefono}</p>}
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="correo" className="block text-sm font-medium text-foreground/80 mb-1">
                  Correo Institucional
                </label>
                <input
                  id="correo"
                  name="correo"
                  type="email"
                  value={formData.correo}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 rounded-xl border ${errors.correo ? 'border-error' : 'border-border'} bg-surface/50 focus:bg-surface focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all duration-200 text-foreground`}
                />
                {errors.correo && <p className="mt-1 text-sm text-error">{errors.correo}</p>}
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="direccion" className="block text-sm font-medium text-foreground/80 mb-1">
                  Dirección
                </label>
                <input
                  id="direccion"
                  name="direccion"
                  type="text"
                  value={formData.direccion}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 rounded-xl border ${errors.direccion ? 'border-error' : 'border-border'} bg-surface/50 focus:bg-surface focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all duration-200 text-foreground`}
                />
                {errors.direccion && <p className="mt-1 text-sm text-error">{errors.direccion}</p>}
              </div>

              <div>
                <label htmlFor="ciudad" className="block text-sm font-medium text-foreground/80 mb-1">
                  Ciudad
                </label>
                <input
                  id="ciudad"
                  name="ciudad"
                  type="text"
                  value={formData.ciudad}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 rounded-xl border ${errors.ciudad ? 'border-error' : 'border-border'} bg-surface/50 focus:bg-surface focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all duration-200 text-foreground`}
                />
                {errors.ciudad && <p className="mt-1 text-sm text-error">{errors.ciudad}</p>}
              </div>

              <div>
                <label htmlFor="provincia" className="block text-sm font-medium text-foreground/80 mb-1">
                  Provincia
                </label>
                <input
                  id="provincia"
                  name="provincia"
                  type="text"
                  value={formData.provincia}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 rounded-xl border ${errors.provincia ? 'border-error' : 'border-border'} bg-surface/50 focus:bg-surface focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all duration-200 text-foreground`}
                />
                {errors.provincia && <p className="mt-1 text-sm text-error">{errors.provincia}</p>}
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={mutation.isPending}
                className="w-full py-3 px-4 flex items-center justify-center rounded-xl font-medium text-white bg-primary hover:bg-primary-hover focus:ring-4 focus:ring-primary/30 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-primary/25"
              >
                {mutation.isPending ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  'Guardar Configuración'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
