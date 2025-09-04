import { AuthGuard } from '@/components/auth/auth-guard';

export default function PartnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard requireAuth={true} requiredRole="analyst">
      {children}
    </AuthGuard>
  );
}