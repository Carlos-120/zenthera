'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { getMedicoById } from '@/lib/api/medicos';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { MedicoCuentaAccess } from '@/components/medicos/MedicoCuentaAccess';
import { ArrowLeft, Stethoscope, Mail, Phone, MapPin, Award, Activity } from 'lucide-react';
import Link from 'next/link';

export default function MedicoDetallePage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);

  const { data, isLoading, error } = useQuery({
    queryKey: ['medico', id],
    queryFn: () => getMedicoById(id),
    enabled: !isNaN(id),
  });

  const medico = data?.data;

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
        <div className="h-20 bg-surface/50 rounded-2xl" />
        <div className="h-64 bg-surface/50 rounded-2xl" />
      </div>
    );
  }

  if (error || !medico) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <h2 className="text-2xl font-bold text-error mb-4">Error al cargar médico</h2>
        <button onClick={() => router.back()} className="text-primary hover:underline">
          Volver atrás
        </button>
      </div>
    );
  }

  return (
    <RoleGuard allowedRoles={['ADMIN_CLINICA']}>
      <div className="max-w-5xl mx-auto space-y-6 animate-fade-in pb-10">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link 
            href="/dashboard/medicos"
            className="p-2 hover:bg-surface rounded-xl transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Stethoscope className="w-8 h-8 text-primary" />
              Detalle del Médico
            </h1>
            <p className="text-foreground/60">Gestiona la información y accesos del profesional.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Info Column */}
          <div className="lg:col-span-2 space-y-6">
            <div className="glass rounded-2xl p-6 border border-border relative overflow-hidden">
              <div className={`absolute top-0 left-0 w-1.5 h-full ${medico.activo ? 'bg-success' : 'bg-foreground/20'}`} />
              
              <div className="flex justify-between items-start mb-6 ml-4">
                <div>
                  <h2 className="text-2xl font-bold">
                    {medico.nombres} {medico.apellidos}
                  </h2>
                  <p className="text-primary font-medium mt-1 text-lg">
                    {medico.especialidad}
                  </p>
                </div>
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                  medico.activo 
                    ? 'bg-success/10 text-success border border-success/20' 
                    : 'bg-foreground/5 text-foreground/60 border border-border'
                }`}>
                  {medico.activo ? 'Activo' : 'Inactivo'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 ml-4">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Activity className="w-5 h-5 text-foreground/40" />
                    <div>
                      <p className="text-xs text-foreground/60">Cédula</p>
                      <p className="font-medium">{medico.cedula}</p>
                    </div>
                  </div>
                  {medico.registroProfesional && (
                    <div className="flex items-center gap-3">
                      <Award className="w-5 h-5 text-foreground/40" />
                      <div>
                        <p className="text-xs text-foreground/60">Registro Profesional</p>
                        <p className="font-medium">{medico.registroProfesional}</p>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="space-y-4">
                  {medico.correo && (
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-foreground/40" />
                      <div>
                        <p className="text-xs text-foreground/60">Correo Electrónico</p>
                        <p className="font-medium">{medico.correo}</p>
                      </div>
                    </div>
                  )}
                  {medico.telefono && (
                    <div className="flex items-center gap-3">
                      <Phone className="w-5 h-5 text-foreground/40" />
                      <div>
                        <p className="text-xs text-foreground/60">Teléfono</p>
                        <p className="font-medium">{medico.telefono}</p>
                      </div>
                    </div>
                  )}
                </div>

                {medico.direccion && (
                  <div className="col-span-full flex items-center gap-3 mt-2 pt-4 border-t border-border/50">
                    <MapPin className="w-5 h-5 text-foreground/40" />
                    <div>
                      <p className="text-xs text-foreground/60">Dirección</p>
                      <p className="font-medium">{medico.direccion}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Access & Security Column */}
          <div className="lg:col-span-1 space-y-6">
            <MedicoCuentaAccess medico={medico} />
          </div>

        </div>
      </div>
    </RoleGuard>
  );
}
