import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ForcePasswordChangeGuard } from '@/components/auth/ForcePasswordChangeGuard';

export default function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ForcePasswordChangeGuard>
      <DashboardLayout>
        {children}
      </DashboardLayout>
    </ForcePasswordChangeGuard>
  );
}
