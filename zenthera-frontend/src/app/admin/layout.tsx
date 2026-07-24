import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { RoleGuard } from '@/components/auth/RoleGuard';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard allowedRoles={['SUPER_ADMIN']}>
      <DashboardLayout>
        {children}
      </DashboardLayout>
    </RoleGuard>
  );
}
