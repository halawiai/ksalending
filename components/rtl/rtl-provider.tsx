'use client';

import { createContext, useContext, useState, useEffect } from 'react';

interface RTLContextType {
  isRTL: boolean;
  language: 'en' | 'ar';
  toggleLanguage: () => void;
  setLanguage: (lang: 'en' | 'ar') => void;
  t: (key: string) => string;
}

const RTLContext = createContext<RTLContextType | undefined>(undefined);

interface RTLProviderProps {
  children: React.ReactNode;
  defaultLanguage?: 'en' | 'ar';
}

// Translation dictionary
const translations = {
  en: {
    // Navigation
    'nav.home': 'Home',
    'nav.individual': 'Individual',
    'nav.company': 'Company', 
    'nav.institution': 'Institution',
    'nav.settings': 'Settings',
    'nav.logout': 'Sign Out',
    
    // Common
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.cancel': 'Cancel',
    'common.save': 'Save',
    'common.submit': 'Submit',
    'common.next': 'Next',
    'common.previous': 'Previous',
    'common.continue': 'Continue',
    'common.back': 'Back',
    
    // Authentication
    'auth.signin': 'Sign In',
    'auth.signup': 'Sign Up',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.confirmPassword': 'Confirm Password',
    'auth.forgotPassword': 'Forgot Password?',
    'auth.rememberMe': 'Remember Me',
    
    // Dashboard
    'dashboard.title': 'Dashboard',
    'dashboard.creditScore': 'Credit Score',
    'dashboard.riskLevel': 'Risk Level',
    'dashboard.activeLoans': 'Active Loans',
    'dashboard.availableCredit': 'Available Credit',
    
    // Forms
    'form.required': 'Required',
    'form.optional': 'Optional',
    'form.validation.email': 'Please enter a valid email',
    'form.validation.phone': 'Please enter a valid phone number',
    'form.validation.nationalId': 'Please enter a valid National ID',
    
    // Onboarding
    'onboarding.title': 'Complete Your Profile',
    'onboarding.step': 'Step',
    'onboarding.of': 'of',
    'onboarding.basicInfo': 'Basic Information',
    'onboarding.verification': 'Identity Verification',
    'onboarding.employment': 'Employment Details',
    'onboarding.financial': 'Financial Information',
    'onboarding.consent': 'Consent & Privacy',
    
    // Assessment
    'assessment.title': 'Credit Assessment',
    'assessment.score': 'Credit Score',
    'assessment.risk': 'Risk Level',
    'assessment.approved': 'Approved',
    'assessment.declined': 'Declined',
    'assessment.pending': 'Under Review',
  },
  ar: {
    // Navigation
    'nav.home': 'الرئيسية',
    'nav.individual': 'الأفراد',
    'nav.company': 'الشركات',
    'nav.institution': 'المؤسسات',
    'nav.settings': 'الإعدادات',
    'nav.logout': 'تسجيل الخروج',
    
    // Common
    'common.loading': 'جاري التحميل...',
    'common.error': 'خطأ',
    'common.success': 'نجح',
    'common.cancel': 'إلغاء',
    'common.save': 'حفظ',
    'common.submit': 'إرسال',
    'common.next': 'التالي',
    'common.previous': 'السابق',
    'common.continue': 'متابعة',
    'common.back': 'رجوع',
    
    // Authentication
    'auth.signin': 'تسجيل الدخول',
    'auth.signup': 'إنشاء حساب',
    'auth.email': 'البريد الإلكتروني',
    'auth.password': 'كلمة المرور',
    'auth.confirmPassword': 'تأكيد كلمة المرور',
    'auth.forgotPassword': 'نسيت كلمة المرور؟',
    'auth.rememberMe': 'تذكرني',
    
    // Dashboard
    'dashboard.title': 'لوحة التحكم',
    'dashboard.creditScore': 'النقاط الائتمانية',
    'dashboard.riskLevel': 'مستوى المخاطر',
    'dashboard.activeLoans': 'القروض النشطة',
    'dashboard.availableCredit': 'الائتمان المتاح',
    
    // Forms
    'form.required': 'مطلوب',
    'form.optional': 'اختياري',
    'form.validation.email': 'يرجى إدخال بريد إلكتروني صحيح',
    'form.validation.phone': 'يرجى إدخال رقم هاتف صحيح',
    'form.validation.nationalId': 'يرجى إدخال رقم هوية صحيح',
    
    // Onboarding
    'onboarding.title': 'أكمل ملفك الشخصي',
    'onboarding.step': 'الخطوة',
    'onboarding.of': 'من',
    'onboarding.basicInfo': 'المعلومات الأساسية',
    'onboarding.verification': 'التحقق من الهوية',
    'onboarding.employment': 'تفاصيل العمل',
    'onboarding.financial': 'المعلومات المالية',
    'onboarding.consent': 'الموافقة والخصوصية',
    
    // Assessment
    'assessment.title': 'التقييم الائتماني',
    'assessment.score': 'النقاط الائتمانية',
    'assessment.risk': 'مستوى المخاطر',
    'assessment.approved': 'موافق عليه',
    'assessment.declined': 'مرفوض',
    'assessment.pending': 'قيد المراجعة',
  },
};

export function RTLProvider({ children, defaultLanguage = 'en' }: RTLProviderProps) {
  const [language, setLanguageState] = useState<'en' | 'ar'>(defaultLanguage);
  const [isRTL, setIsRTL] = useState(defaultLanguage === 'ar');

  useEffect(() => {
    // Load saved language preference
    const savedLanguage = localStorage.getItem('ksa-lending-language') as 'en' | 'ar';
    if (savedLanguage && savedLanguage !== language) {
      setLanguageState(savedLanguage);
      setIsRTL(savedLanguage === 'ar');
    }
  }, [language]);

  useEffect(() => {
    // Update document direction and language
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
    
    // Update CSS custom properties for RTL
    document.documentElement.style.setProperty('--text-align-start', isRTL ? 'right' : 'left');
    document.documentElement.style.setProperty('--text-align-end', isRTL ? 'left' : 'right');
    document.documentElement.style.setProperty('--margin-start', isRTL ? 'margin-right' : 'margin-left');
    document.documentElement.style.setProperty('--margin-end', isRTL ? 'margin-left' : 'margin-right');
    document.documentElement.style.setProperty('--padding-start', isRTL ? 'padding-right' : 'padding-left');
    document.documentElement.style.setProperty('--padding-end', isRTL ? 'padding-left' : 'padding-right');
  }, [isRTL, language]);

  const toggleLanguage = () => {
    const newLanguage = language === 'en' ? 'ar' : 'en';
    setLanguage(newLanguage);
  };

  const setLanguage = (lang: 'en' | 'ar') => {
    setLanguageState(lang);
    setIsRTL(lang === 'ar');
    localStorage.setItem('ksa-lending-language', lang);
  };

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations['en']] || key;
  };

  const value: RTLContextType = {
    isRTL,
    language,
    toggleLanguage,
    setLanguage,
    t,
  };

  return (
    <RTLContext.Provider value={value}>
      <div className={isRTL ? 'rtl' : 'ltr'}>
        {children}
      </div>
    </RTLContext.Provider>
  );
}

export function useRTL() {
  const context = useContext(RTLContext);
  if (context === undefined) {
    throw new Error('useRTL must be used within an RTLProvider');
  }
  return context;
}

// Utility functions for RTL support
export const rtlUtils = {
  // Get appropriate margin/padding classes for RTL
  getStartClass: (className: string, isRTL: boolean): string => {
    if (className.includes('ml-') || className.includes('pl-')) {
      const value = className.match(/[mp]l-(\d+)/)?.[1];
      if (value) {
        const property = className.includes('ml-') ? 'mr-' : 'pr-';
        return isRTL ? property + value : className;
      }
    }
    return className;
  },

  getEndClass: (className: string, isRTL: boolean): string => {
    if (className.includes('mr-') || className.includes('pr-')) {
      const value = className.match(/[mp]r-(\d+)/)?.[1];
      if (value) {
        const property = className.includes('mr-') ? 'ml-' : 'pl-';
        return isRTL ? property + value : className;
      }
    }
    return className;
  },

  // Format numbers for Arabic locale
  formatNumber: (number: number, locale: 'en' | 'ar'): string => {
    return new Intl.NumberFormat(locale === 'ar' ? 'ar-SA' : 'en-US').format(number);
  },

  // Format currency for Saudi Riyal
  formatCurrency: (amount: number, locale: 'en' | 'ar'): string => {
    return new Intl.NumberFormat(locale === 'ar' ? 'ar-SA' : 'en-US', {
      style: 'currency',
      currency: 'SAR',
    }).format(amount);
  },

  // Format dates for Arabic locale
  formatDate: (date: Date | string, locale: 'en' | 'ar'): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(dateObj);
  },
};