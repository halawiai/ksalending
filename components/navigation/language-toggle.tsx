'use client';

import { Button } from '@/components/ui/button';
import { Languages } from 'lucide-react';
import { useRTL } from '@/components/rtl/rtl-provider';

export function LanguageToggle() {
  const { language, toggleLanguage } = useRTL();

  return (
    <Button 
      variant="ghost" 
      size="sm" 
      className="text-emerald-700 hover:bg-emerald-100"
      onClick={toggleLanguage}
    >
      <Languages className="w-4 h-4 mr-2" />
      {language === 'en' ? 'العربية' : 'English'}
    </Button>
  );
}