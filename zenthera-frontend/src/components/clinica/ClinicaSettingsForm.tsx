'use client';

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { ClinicaResponse, ClinicaUpdateRequest } from '@/lib/api/clinicas';
import { Building2, MapPin, Globe, Clock, Save, Info, Link as LinkIcon, Mail, Phone } from 'lucide-react';

interface ClinicaSettingsFormProps {
  initialData: ClinicaResponse;
  onSubmit: (data: ClinicaUpdateRequest) => void;
  isPending: boolean;
  error?: string | null;
}

export function ClinicaSettingsForm({ initialData, onSubmit, isPending, error }: ClinicaSettingsFormProps) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<ClinicaUpdateRequest>({
    defaultValues: {
      nombre: initialData.nombre || '',
      logo: initialData.logo || '',
      telefono: initialData.telefono || '',
      correo: initialData.correo || '',
      direccion: initialData.direccion || '',
      ciudad: initialData.ciudad || '',
      provincia: initialData.provincia || '',
      pais: initialData.pais || '',
      zonaHoraria: initialData.zonaHoraria || 'America/Guayaquil',
    }
  });

  useEffect(() => {
    reset({
      nombre: initialData.nombre || '',
      logo: initialData.logo || '',
      telefono: initialData.telefono || '',
      correo: initialData.correo || '',
      direccion: initialData.direccion || '',
      ciudad: initialData.ciudad || '',
      provincia: initialData.provincia || '',
      pais: initialData.pais || '',
      zonaHoraria: initialData.zonaHoraria || 'America/Guayaquil',
    });
  }, [initialData, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 animate-fade-in" data-testid="clinica-settings-form">
      {error && (
        <div className="p-4 rounded-xl bg-error/10 border border-error/20 text-error flex items-start gap-3">
          <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Información Legal (Solo Lectura) */}
      <section className="glass rounded-2xl p-6 border border-border">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-indigo-500/10 text-indigo-500 rounded-lg border border-indigo-500/20">
            <Building2 className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-semibold">Información Legal y Fiscal</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label htmlFor="ruc" className="block text-sm font-medium text-foreground/70 mb-1">RUC</label>
            <input id="ruc" type="text" value={initialData.ruc} readOnly className="w-full bg-surface/50 border border-border rounded-lg px-4 py-2.5 text-foreground/60 cursor-not-allowed" />
          </div>
          <div className="md:col-span-2">
            <label htmlFor="razonSocial" className="block text-sm font-medium text-foreground/70 mb-1">Razón Social</label>
            <input id="razonSocial" type="text" value={initialData.razonSocial} readOnly className="w-full bg-surface/50 border border-border rounded-lg px-4 py-2.5 text-foreground/60 cursor-not-allowed" />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground/70 mb-1">Estado de Operación</label>
            <div className="w-full bg-surface/50 border border-border rounded-lg px-4 py-2.5 flex items-center gap-2 cursor-not-allowed">
              <div className={`w-2 h-2 rounded-full ${initialData.activa ? 'bg-success animate-pulse' : 'bg-error'}`}></div>
              <span className={`font-medium ${initialData.activa ? 'text-success' : 'text-error'}`}>
                {initialData.activa ? 'ACTIVA' : 'SUSPENDIDA'}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Información Operativa */}
      <section className="glass rounded-2xl p-6 border border-border">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary/10 text-primary rounded-lg border border-primary/20">
            <Info className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-semibold">Configuración Operativa</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="nombre" className="block text-sm font-medium text-foreground/90 mb-1">Nombre Comercial *</label>
            <input
              id="nombre"
              type="text"
              {...register('nombre', { required: 'El nombre es obligatorio' })}
              className={`w-full bg-background border rounded-lg px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow ${errors.nombre ? 'border-error' : 'border-border'}`}
            />
            {errors.nombre && <p className="mt-1 text-sm text-error">{errors.nombre.message}</p>}
          </div>

          <div>
            <label htmlFor="logo" className="block text-sm font-medium text-foreground/90 mb-1 flex items-center gap-2">
              <LinkIcon className="w-4 h-4 text-foreground/50" /> URL del Logo
            </label>
            <input
              id="logo"
              type="url"
              placeholder="https://ejemplo.com/logo.png"
              {...register('logo')}
              className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
            />
          </div>

          <div>
            <label htmlFor="correo" className="block text-sm font-medium text-foreground/90 mb-1 flex items-center gap-2">
              <Mail className="w-4 h-4 text-foreground/50" /> Correo de Contacto *
            </label>
            <input
              id="correo"
              type="email"
              {...register('correo', { required: 'El correo es obligatorio', pattern: { value: /\S+@\S+\.\S+/, message: 'Correo inválido' } })}
              className={`w-full bg-background border rounded-lg px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow ${errors.correo ? 'border-error' : 'border-border'}`}
            />
            {errors.correo && <p className="mt-1 text-sm text-error">{errors.correo.message}</p>}
          </div>

          <div>
            <label htmlFor="telefono" className="block text-sm font-medium text-foreground/90 mb-1 flex items-center gap-2">
              <Phone className="w-4 h-4 text-foreground/50" /> Teléfono *
            </label>
            <input
              id="telefono"
              type="text"
              {...register('telefono', { required: 'El teléfono es obligatorio' })}
              className={`w-full bg-background border rounded-lg px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow ${errors.telefono ? 'border-error' : 'border-border'}`}
            />
            {errors.telefono && <p className="mt-1 text-sm text-error">{errors.telefono.message}</p>}
          </div>
        </div>
      </section>

      {/* Ubicación y Localización */}
      <section className="glass rounded-2xl p-6 border border-border">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-success/10 text-success rounded-lg border border-success/20">
            <Globe className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-semibold">Ubicación y Localización</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label htmlFor="direccion" className="block text-sm font-medium text-foreground/90 mb-1 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-foreground/50" /> Dirección Principal *
            </label>
            <input
              id="direccion"
              type="text"
              {...register('direccion', { required: 'La dirección es obligatoria' })}
              className={`w-full bg-background border rounded-lg px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow ${errors.direccion ? 'border-error' : 'border-border'}`}
            />
            {errors.direccion && <p className="mt-1 text-sm text-error">{errors.direccion.message}</p>}
          </div>

          <div>
            <label htmlFor="ciudad" className="block text-sm font-medium text-foreground/90 mb-1">Ciudad</label>
            <input
              id="ciudad"
              type="text"
              {...register('ciudad')}
              className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
            />
          </div>

          <div>
            <label htmlFor="provincia" className="block text-sm font-medium text-foreground/90 mb-1">Provincia/Estado</label>
            <input
              id="provincia"
              type="text"
              {...register('provincia')}
              className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
            />
          </div>

          <div>
            <label htmlFor="pais" className="block text-sm font-medium text-foreground/90 mb-1">País</label>
            <input
              id="pais"
              type="text"
              {...register('pais')}
              className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
            />
          </div>

          <div>
            <label htmlFor="zonaHoraria" className="block text-sm font-medium text-foreground/90 mb-1 flex items-center gap-2">
              <Clock className="w-4 h-4 text-foreground/50" /> Zona Horaria *
            </label>
            <select
              id="zonaHoraria"
              {...register('zonaHoraria', { required: 'La zona horaria es obligatoria' })}
              className={`w-full bg-background border rounded-lg px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow ${errors.zonaHoraria ? 'border-error' : 'border-border'}`}
            >
              <option value="America/Guayaquil">America/Guayaquil (Ecuador Continental)</option>
              <option value="America/Bogota">America/Bogota (Colombia)</option>
              <option value="America/Lima">America/Lima (Perú)</option>
              <option value="America/Mexico_City">America/Mexico_City (México)</option>
              <option value="America/Argentina/Buenos_Aires">America/Argentina/Buenos_Aires</option>
              <option value="America/Santiago">America/Santiago (Chile)</option>
              <option value="UTC">UTC (Universal)</option>
            </select>
            {errors.zonaHoraria && <p className="mt-1 text-sm text-error">{errors.zonaHoraria.message}</p>}
          </div>
        </div>
      </section>

      <div className="flex justify-end pt-4">
        <button
          type="submit"
          disabled={isPending}
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8 py-3 rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isPending ? (
            <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin"></div>
          ) : (
            <Save className="w-5 h-5" />
          )}
          Guardar Cambios
        </button>
      </div>
    </form>
  );
}
