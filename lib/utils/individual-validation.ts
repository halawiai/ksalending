import { z } from 'zod';

// Step 1 - Basic Information Schema
export const basicInfoSchema = z.object({
  fullNameArabic: z.string().min(2, 'الاسم باللغة العربية مطلوب').max(100),
  fullNameEnglish: z.string().min(2, 'Full name in English is required').max(100),
  email: z.string().email('Please enter a valid email address'),
  mobileNumber: z.string()
    .regex(/^(\+966|966|0)?[5][0-9]{8}$/, 'Please enter a valid Saudi mobile number'),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  nationality: z.string().min(2, 'Nationality is required'),
});

// Step 2 - Identity Verification Schema
export const identitySchema = z.object({
  nationalId: z.string()
    .regex(/^[12][0-9]{9}$/, 'National ID must be 10 digits starting with 1 or 2'),
  nafathVerified: z.boolean(),
  documentUploaded: z.boolean(),
});

// Step 3 - Employment Details Schema
export const employmentSchema = z.object({
  employeeType: z.enum(['government', 'private', 'military', 'self_employed']),
  sector: z.string().min(2, 'Sector is required'),
  occupation: z.string().min(2, 'Occupation is required'),
  jobTitle: z.string().min(2, 'Job title is required'),
  monthlySalary: z.number().min(1000, 'Monthly salary must be at least 1,000 SAR'),
  yearsEmployed: z.number().min(0, 'Years employed cannot be negative').max(50),
  employerName: z.string().min(2, 'Employer name is required'),
  employerAddress: z.string().min(10, 'Employer address is required'),
});

// Step 4 - Financial Information Schema
export const financialSchema = z.object({
  bankAccounts: z.array(z.object({
    bankName: z.string().min(2, 'Bank name is required'),
    iban: z.string().regex(/^SA[0-9]{22}$/, 'Please enter a valid Saudi IBAN'),
    accountType: z.enum(['checking', 'savings']),
  })).min(1, 'At least one bank account is required'),
  monthlyIncome: z.number().min(1000, 'Monthly income must be at least 1,000 SAR'),
  monthlyExpenses: z.number().min(0, 'Monthly expenses cannot be negative'),
  existingLoans: z.array(z.object({
    lenderName: z.string().min(2, 'Lender name is required'),
    loanType: z.string().min(2, 'Loan type is required'),
    outstandingAmount: z.number().min(0, 'Outstanding amount cannot be negative'),
    monthlyPayment: z.number().min(0, 'Monthly payment cannot be negative'),
  })),
  assets: z.array(z.object({
    assetType: z.enum(['property', 'vehicle', 'investment', 'other']),
    description: z.string().min(2, 'Asset description is required'),
    estimatedValue: z.number().min(0, 'Asset value cannot be negative'),
  })),
});

// Step 5 - Consent Schema
export const consentSchema = z.object({
  pdplConsent: z.boolean().refine(val => val === true, {
    message: 'You must agree to the Personal Data Protection Law terms'
  }),
  dataUsageConsent: z.boolean().refine(val => val === true, {
    message: 'You must agree to data usage terms'
  }),
  creditBureauConsent: z.boolean().refine(val => val === true, {
    message: 'You must authorize credit bureau access'
  }),
  marketingConsent: z.boolean(),
});

// Complete form schema
export const completeIndividualSchema = basicInfoSchema
  .merge(identitySchema)
  .merge(employmentSchema)
  .merge(financialSchema)
  .merge(consentSchema);

export type BasicInfoFormData = z.infer<typeof basicInfoSchema>;
export type IdentityFormData = z.infer<typeof identitySchema>;
export type EmploymentFormData = z.infer<typeof employmentSchema>;
export type FinancialFormData = z.infer<typeof financialSchema>;
export type ConsentFormData = z.infer<typeof consentSchema>;
export type CompleteIndividualFormData = z.infer<typeof completeIndividualSchema>;