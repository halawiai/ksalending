'use client';

import { Button } from '@/components/ui/button';
import { Building2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function PartnerLogin() {
  const router = useRouter();

  const handlePartnerLogin = () => {
    // Redirect to the login page for partner authentication
    // Partners use the same login flow but may have different roles/permissions
    router.push('/login');
  };

  return (
    <Button 
      variant="outline" 
      size="sm" 
      className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
      onClick={handlePartnerLogin}
    >
      <Building2 className="w-4 h-4 mr-2" />
      Partner Login
    </Button>
  );
}