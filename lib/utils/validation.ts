import { z } from 'zod';

export const individualSchema = z.object({
  national_id: z.string().min(10, 'National ID must be at least 10 characters'),
  first_name: z.string().min(2, 'First name is required'),
  last_name: z.string().min(2, 'Last name is required'),
  date_of_birth: z.string(),
  nationality: z.string().min(2, 'Nationality is required'),
  phone_number: z.string().min(10, 'Valid phone number is required'),
  email: z.string().email('Valid email is required'),
  monthly_income: z.number().optional(),
  employment_status: z.enum(['employed', 'self_employed', 'unemployed', 'retired']),
  employer_name: z.string().optional(),
});

export const companySchema = z.object({
  commercial_registration: z.string().min(8, 'Commercial registration is required'),
  company_name: z.string().min(2, 'Company name is required'),
  legal_form: z.enum(['llc', 'joint_stock', 'partnership', 'sole_proprietorship']),
  establishment_date: z.string(),
  industry_sector: z.string().min(2, 'Industry sector is required'),
  annual_revenue: z.number().optional(),
  employee_count: z.number().optional(),
});

export const institutionSchema = z.object({
  license_number: z.string().min(8, 'License number is required'),
  institution_name: z.string().min(2, 'Institution name is required'),
  institution_type: z.enum(['bank', 'finance_company', 'microfinance', 'cooperative']),
  regulatory_authority: z.enum(['sama', 'cma', 'other']),
  capital_adequacy_ratio: z.number().optional(),
});

export type IndividualFormData = z.infer<typeof individualSchema>;
export type CompanyFormData = z.infer<typeof companySchema>;
export type InstitutionFormData = z.infer<typeof institutionSchema>;