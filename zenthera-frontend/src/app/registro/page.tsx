import RegisterClinicForm from '@/components/auth/RegisterClinicForm';
import { PublicLayout } from '@/components/public/PublicLayout';
import { PublicSecurityNotice } from '@/components/public/PublicSecurityNotice';

export const metadata = {
  title: 'Registrar cl\u00ednica | Zenthera',
  description: 'Registra una cl\u00ednica en Zenthera',
};

export default function RegistroPage() {
  return (
    <PublicLayout contentClassName="max-w-5xl">
      <div className="py-2 sm:py-4">
        <RegisterClinicForm />
        <PublicSecurityNotice />
      </div>
    </PublicLayout>
  );
}
