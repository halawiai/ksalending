import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface IndividualFormData {
  // Step 1 - Basic Information
  fullNameArabic: string;
  fullNameEnglish: string;
  email: string;
  mobileNumber: string;
  dateOfBirth: string;
  nationality: string;
  
  // Step 2 - Identity Verification
  nationalId: string;
  nafathVerified: boolean;
  documentUploaded: boolean;
  
  // Step 3 - Employment Details
  employeeType: 'government' | 'private' | 'military' | 'self_employed';
  sector: string;
  occupation: string;
  jobTitle: string;
  monthlySalary: number;
  yearsEmployed: number;
  employerName: string;
  employerAddress: string;
  
  // Step 4 - Financial Information
  bankAccounts: Array<{
    bankName: string;
    iban: string;
    accountType: 'checking' | 'savings';
  }>;
  monthlyIncome: number;
  monthlyExpenses: number;
  existingLoans: Array<{
    lenderName: string;
    loanType: string;
    outstandingAmount: number;
    monthlyPayment: number;
  }>;
  assets: Array<{
    assetType: 'property' | 'vehicle' | 'investment' | 'other';
    description: string;
    estimatedValue: number;
  }>;
  
  // Step 5 - Consent & Privacy
  pdplConsent: boolean;
  dataUsageConsent: boolean;
  creditBureauConsent: boolean;
  marketingConsent: boolean;
}

interface OnboardingState {
  currentStep: number;
  formData: Partial<IndividualFormData>;
  isSubmitting: boolean;
  errors: Record<string, string>;
  
  // Actions
  setCurrentStep: (step: number) => void;
  updateFormData: (data: Partial<IndividualFormData>) => void;
  setSubmitting: (submitting: boolean) => void;
  setErrors: (errors: Record<string, string>) => void;
  resetForm: () => void;
  saveProgress: () => void;
}

const initialFormData: Partial<IndividualFormData> = {
  bankAccounts: [],
  existingLoans: [],
  assets: [],
  pdplConsent: false,
  dataUsageConsent: false,
  creditBureauConsent: false,
  marketingConsent: false,
  nafathVerified: false,
  documentUploaded: false,
};

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set, get) => ({
      currentStep: 1,
      formData: initialFormData,
      isSubmitting: false,
      errors: {},
      
      setCurrentStep: (step) => set({ currentStep: step }),
      
      updateFormData: (data) => 
        set((state) => ({
          formData: { ...state.formData, ...data }
        })),
      
      setSubmitting: (submitting) => set({ isSubmitting: submitting }),
      
      setErrors: (errors) => set({ errors }),
      
      resetForm: () => set({
        currentStep: 1,
        formData: initialFormData,
        isSubmitting: false,
        errors: {}
      }),
      
      saveProgress: () => {
        // Progress is automatically saved due to persist middleware
        console.log('Progress saved:', get().formData);
      }
    }),
    {
      name: 'individual-onboarding',
      partialize: (state) => ({
        currentStep: state.currentStep,
        formData: state.formData
      })
    }
  )
);