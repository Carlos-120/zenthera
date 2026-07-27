import RegisterClinicForm from '@/components/auth/RegisterClinicForm';

export const metadata = {
  title: 'Registrar cl\u00ednica | Zenthera',
  description: 'Registra una cl\u00ednica en Zenthera',
};

export default function RegistroPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background px-4 py-10 sm:py-16">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-24 -top-24 h-80 w-80 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-success/10 blur-3xl" />
      </div>
      <div className="relative z-10 flex min-h-[calc(100vh-5rem)] items-center justify-center">
        <RegisterClinicForm />
      </div>
    </main>
  );
}
