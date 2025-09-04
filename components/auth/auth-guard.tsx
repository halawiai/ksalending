'use client';

import { useAuth } from '@/lib/hooks/use-auth';
import { useUser } from '@/lib/hooks/use-user';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requiredRole?: 'admin' | 'analyst' | 'viewer' | 'entity_user';
  requiredEntityType?: 'individual' | 'company' | 'institution';
}

export function AuthGuard({ 
  children, 
  requireAuth = true, 
  requiredRole,
  requiredEntityType 
}: AuthGuardProps) {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { profile, canAccessEntityType } = useUser();

  useEffect(() => {
    if (!isLoading) {
      // Check authentication requirement
      if (requireAuth && !isAuthenticated) {
        router.push('/login');
        return;
      }

      // Check role requirement
      if (requiredRole && profile?.role !== requiredRole && profile?.role !== 'admin') {
        router.push('/unauthorized');
        return;
      }

      // Check entity type requirement
      if (requiredEntityType && !canAccessEntityType(requiredEntityType)) {
        router.push('/unauthorized');
        return;
      }
    }
  }, [isLoading, isAuthenticated, profile, requireAuth, requiredRole, requiredEntityType, router, canAccessEntityType]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (requireAuth && !isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}