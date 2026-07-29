import React, { Suspense } from 'react';
import ActivationForm from '@/components/auth/ActivationForm';
import { Loader2 } from 'lucide-react';
import { PublicFormCard } from '@/components/public/PublicFormCard';
import { PublicLayout } from '@/components/public/PublicLayout';
import { PublicSecurityNotice } from '@/components/public/PublicSecurityNotice';

export const metadata = {
  title: 'Activar Cuenta | Zenthera',
  description: 'Activa tu cuenta de Zenthera',
};

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center p-12 space-y-4">
      <Loader2 className="w-12 h-12 text-[var(--primary)] animate-spin" />
      <p className="text-gray-500 font-medium animate-pulse">Cargando...</p>
    </div>
  );
}

export default function ActivatePage() {
  return (
    <PublicLayout>
      <div className="py-2 sm:py-4">
        <PublicFormCard className="overflow-hidden p-0">
          <Suspense fallback={<LoadingState />}>
            <ActivationForm />
          </Suspense>
        </PublicFormCard>
        <PublicSecurityNotice />
      </div>
    </PublicLayout>
  );
}
