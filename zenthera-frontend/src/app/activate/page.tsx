import React, { Suspense } from 'react';
import ActivationForm from '@/components/auth/ActivationForm';
import { Loader2 } from 'lucide-react';

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
    <main className="min-h-screen relative flex items-center justify-center overflow-hidden bg-[var(--background)]">
      {/* Background gradients and decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[var(--primary)]/20 rounded-full blur-[100px] animate-fade-in" style={{ animationDuration: '2s' }} />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[var(--success)]/10 rounded-full blur-[100px] animate-fade-in" style={{ animationDuration: '3s' }} />
      </div>

      <div className="w-full max-w-md mx-auto relative z-10 p-4">
        <div className="glass rounded-2xl overflow-hidden transition-all duration-300">
          <Suspense fallback={<LoadingState />}>
            <ActivationForm />
          </Suspense>
        </div>

        <div className="mt-8 text-center animate-fade-in" style={{ animationDelay: '0.2s', animationFillMode: 'both' }}>
          <p className="text-sm text-gray-500">
            Zenthera &copy; {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </main>
  );
}
