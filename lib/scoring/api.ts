/**
 * Credit Scoring API Integration
 * Handles external API calls and data integration for the scoring engine
 */

import { supabaseAdmin } from '@/lib/supabase/admin';
import { 
  CreditBureauResponse, 
  GovernmentDataResponse, 
  AlternativeDataResponse,
  ScoringAPIRequest,
  ScoringAPIResponse 
} from './types';

// API Configuration
const API_CONFIG = {
  SIMAH_BASE_URL: process.env.SIMAH_API_URL || 'https://api.simah.com/v1',
  NCCGR_BASE_URL: process.env.NCCGR_API_URL || 'https://api.nccgr.gov.sa/v1',
  GOSI_BASE_URL: process.env.GOSI_API_URL || 'https://api.gosi.gov.sa/v1',
  TAX_AUTHORITY_BASE_URL: process.env.TAX_API_URL || 'https://api.gazt.gov.sa/v1',
  TIMEOUT: 10000, // 10 seconds
  RETRY_ATTEMPTS: 3,
  CACHE_DURATION: 300000, // 5 minutes
} as const;

// API Headers
const getAPIHeaders = (apiKey: string) => ({
  'Authorization': `Bearer ${apiKey}`,
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'User-Agent': 'KSA-Lending-System/1.0',
});

/**
 * SIMAH Credit Bureau Integration
 */
export class SIMAHIntegration {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.SIMAH_API_KEY || '';
    this.baseUrl = API_CONFIG.SIMAH_BASE_URL;
  }

  async getCreditReport(nationalId: string, reportType: 'full' | 'summary' = 'full'): Promise<CreditBureauResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/credit-reports`, {
        method: 'POST',
        headers: getAPIHeaders(this.apiKey),
        body: JSON.stringify({
          national_id: nationalId,
          report_type: reportType,
          include_score: true,
          include_history: true,
        }),
        signal: AbortSignal.timeout(API_CONFIG.TIMEOUT),
      });

      if (!response.ok) {
        throw new Error(`SIMAH API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return this.transformSIMAHResponse(data);
    } catch (error) {
      console.error('SIMAH API error:', error);
      throw new Error(`Failed to fetch SIMAH credit report: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getBusinessCreditReport(commercialRegistration: string): Promise<CreditBureauResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/business-credit-reports`, {
        method: 'POST',
        headers: getAPIHeaders(this.apiKey),
        body: JSON.stringify({
          commercial_registration: commercialRegistration,
          include_financial_data: true,
          include_payment_behavior: true,
        }),
        signal: AbortSignal.timeout(API_CONFIG.TIMEOUT),
      });

      if (!response.ok) {
        throw new Error(`SIMAH Business API error: ${response.status}`);
      }

      const data = await response.json();
      return this.transformSIMAHResponse(data);
    } catch (error) {
      console.error('SIMAH Business API error:', error);
      throw error;
    }
  }

  private transformSIMAHResponse(data: any): CreditBureauResponse {
    return {
      bureauId: 'simah',
      entityId: data.entity_id || '',
      reportType: data.report_type || 'full',
      creditScore: data.credit_score,
      paymentHistory: data.payment_history?.map((record: any) => ({
        accountId: record.account_id,
        creditorName: record.creditor_name,
        accountType: record.account_type,
        paymentDate: record.payment_date,
        amountDue: record.amount_due,
        amountPaid: record.amount_paid,
        daysLate: record.days_late,
        status: record.status,
        reportingDate: record.reporting_date,
      })) || [],
      creditAccounts: data.credit_accounts?.map((account: any) => ({
        accountId: account.account_id,
        creditorName: account.creditor_name,
        accountType: account.account_type,
        balance: account.balance,
        creditLimit: account.credit_limit,
        monthlyPayment: account.monthly_payment,
        interestRate: account.interest_rate,
        openDate: account.open_date,
        lastPaymentDate: account.last_payment_date,
        status: account.status,
        paymentHistory: account.payment_history,
      })) || [],
      publicRecords: data.public_records || [],
      inquiries: data.inquiries || [],
      alerts: data.alerts || [],
      lastUpdated: data.last_updated || new Date().toISOString(),
      nextUpdateDue: data.next_update_due || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    };
  }
}

/**
 * GOSI (General Organization for Social Insurance) Integration
 */
export class GOSIIntegration {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.GOSI_API_KEY || '';
    this.baseUrl = API_CONFIG.GOSI_BASE_URL;
  }

  async getEmploymentHistory(nationalId: string): Promise<GovernmentDataResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/employment-history`, {
        method: 'POST',
        headers: getAPIHeaders(this.apiKey),
        body: JSON.stringify({
          national_id: nationalId,
          include_salary_history: true,
          include_contributions: true,
        }),
        signal: AbortSignal.timeout(API_CONFIG.TIMEOUT),
      });

      if (!response.ok) {
        throw new Error(`GOSI API error: ${response.status}`);
      }

      const data = await response.json();
      return this.transformGOSIResponse(data);
    } catch (error) {
      console.error('GOSI API error:', error);
      throw error;
    }
  }

  private transformGOSIResponse(data: any): GovernmentDataResponse {
    return {
      entityId: data.national_id,
      dataSource: 'gosi',
      employmentHistory: data.employment_history?.map((record: any) => ({
        employerId: record.employer_id,
        employerName: record.employer_name,
        startDate: record.start_date,
        endDate: record.end_date,
        position: record.position,
        salary: record.salary,
        status: record.status,
      })) || [],
      socialInsurance: {
        subscriberNumber: data.subscriber_number,
        contributionHistory: data.contribution_history || [],
        totalContributions: data.total_contributions || 0,
        eligibleBenefits: data.eligible_benefits || [],
      },
      lastUpdated: data.last_updated || new Date().toISOString(),
    };
  }
}

/**
 * Tax Authority Integration
 */
export class TaxAuthorityIntegration {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.TAX_API_KEY || '';
    this.baseUrl = API_CONFIG.TAX_AUTHORITY_BASE_URL;
  }

  async getTaxRecords(nationalId: string, years: number = 3): Promise<GovernmentDataResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/tax-records`, {
        method: 'POST',
        headers: getAPIHeaders(this.apiKey),
        body: JSON.stringify({
          national_id: nationalId,
          years: years,
          include_returns: true,
          include_payments: true,
        }),
        signal: AbortSignal.timeout(API_CONFIG.TIMEOUT),
      });

      if (!response.ok) {
        throw new Error(`Tax Authority API error: ${response.status}`);
      }

      const data = await response.json();
      return this.transformTaxResponse(data);
    } catch (error) {
      console.error('Tax Authority API error:', error);
      throw error;
    }
  }

  async getBusinessTaxRecords(commercialRegistration: string): Promise<GovernmentDataResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/business-tax-records`, {
        method: 'POST',
        headers: getAPIHeaders(this.apiKey),
        body: JSON.stringify({
          commercial_registration: commercialRegistration,
          include_vat_records: true,
          include_corporate_tax: true,
        }),
        signal: AbortSignal.timeout(API_CONFIG.TIMEOUT),
      });

      if (!response.ok) {
        throw new Error(`Business Tax API error: ${response.status}`);
      }

      const data = await response.json();
      return this.transformTaxResponse(data);
    } catch (error) {
      console.error('Business Tax API error:', error);
      throw error;
    }
  }

  private transformTaxResponse(data: any): GovernmentDataResponse {
    return {
      entityId: data.entity_id,
      dataSource: 'tax_authority',
      taxRecords: data.tax_records?.map((record: any) => ({
        taxYear: record.tax_year,
        filingDate: record.filing_date,
        taxableIncome: record.taxable_income,
        taxPaid: record.tax_paid,
        status: record.status,
        refund: record.refund,
      })) || [],
      businessRegistration: data.business_registration ? {
        registrationNumber: data.business_registration.registration_number,
        businessName: data.business_registration.business_name,
        legalForm: data.business_registration.legal_form,
        registrationDate: data.business_registration.registration_date,
        status: data.business_registration.status,
        activities: data.business_registration.activities || [],
        authorizedCapital: data.business_registration.authorized_capital,
      } : undefined,
      lastUpdated: data.last_updated || new Date().toISOString(),
    };
  }
}

/**
 * Alternative Data Integration
 */
export class AlternativeDataIntegration {
  async getTelecomData(mobileNumber: string): Promise<AlternativeDataResponse> {
    // Mock implementation - would integrate with telecom providers
    await new Promise(resolve => setTimeout(resolve, 500));

    return {
      entityId: mobileNumber,
      dataPoints: [
        {
          source: 'telecom',
          provider: 'STC',
          dataType: 'payment_behavior',
          score: 0.8,
          confidence: 0.9,
          details: {
            averagePaymentDelay: 2,
            missedPayments: 0,
            accountAge: 36,
            planType: 'postpaid',
            usagePattern: 'consistent',
          },
          collectionDate: new Date().toISOString(),
          lastUpdated: new Date().toISOString(),
        },
      ],
      aggregatedScore: 0.8,
      confidence: 0.9,
      lastUpdated: new Date().toISOString(),
    };
  }

  async getUtilityData(accountNumber: string): Promise<AlternativeDataResponse> {
    // Mock implementation - would integrate with utility companies
    await new Promise(resolve => setTimeout(resolve, 400));

    return {
      entityId: accountNumber,
      dataPoints: [
        {
          source: 'utilities',
          provider: 'SEC',
          dataType: 'payment_behavior',
          score: 0.75,
          confidence: 0.85,
          details: {
            averagePaymentDelay: 5,
            missedPayments: 1,
            accountAge: 24,
            averageMonthlyBill: 350,
            seasonalVariation: 'normal',
          },
          collectionDate: new Date().toISOString(),
          lastUpdated: new Date().toISOString(),
        },
      ],
      aggregatedScore: 0.75,
      confidence: 0.85,
      lastUpdated: new Date().toISOString(),
    };
  }

  async getDigitalFootprintData(entityId: string): Promise<AlternativeDataResponse> {
    // Mock implementation - would integrate with digital data providers
    await new Promise(resolve => setTimeout(resolve, 600));

    return {
      entityId,
      dataPoints: [
        {
          source: 'digital_footprint',
          provider: 'DigitalInsights',
          dataType: 'online_behavior',
          score: 0.7,
          confidence: 0.7,
          details: {
            onlinePresence: 'moderate',
            socialMediaActivity: 'active',
            ecommerceHistory: 'regular',
            digitalPaymentUsage: 'frequent',
          },
          collectionDate: new Date().toISOString(),
          lastUpdated: new Date().toISOString(),
        },
      ],
      aggregatedScore: 0.7,
      confidence: 0.7,
      lastUpdated: new Date().toISOString(),
    };
  }
}

/**
 * Data Aggregation Service
 */
export class DataAggregationService {
  private simah: SIMAHIntegration;
  private gosi: GOSIIntegration;
  private taxAuthority: TaxAuthorityIntegration;
  private alternativeData: AlternativeDataIntegration;

  constructor() {
    this.simah = new SIMAHIntegration();
    this.gosi = new GOSIIntegration();
    this.taxAuthority = new TaxAuthorityIntegration();
    this.alternativeData = new AlternativeDataIntegration();
  }

  async aggregateIndividualData(nationalId: string, mobileNumber?: string) {
    const results = await Promise.allSettled([
      this.simah.getCreditReport(nationalId),
      this.gosi.getEmploymentHistory(nationalId),
      this.taxAuthority.getTaxRecords(nationalId),
      mobileNumber ? this.alternativeData.getTelecomData(mobileNumber) : null,
    ]);

    return {
      creditBureau: results[0].status === 'fulfilled' ? results[0].value : null,
      government: results[1].status === 'fulfilled' ? results[1].value : null,
      tax: results[2].status === 'fulfilled' ? results[2].value : null,
      alternative: results[3]?.status === 'fulfilled' ? results[3].value : null,
      errors: results.filter(r => r.status === 'rejected').map(r => (r as PromiseRejectedResult).reason),
    };
  }

  async aggregateCompanyData(commercialRegistration: string) {
    const results = await Promise.allSettled([
      this.simah.getBusinessCreditReport(commercialRegistration),
      this.taxAuthority.getBusinessTaxRecords(commercialRegistration),
    ]);

    return {
      creditBureau: results[0].status === 'fulfilled' ? results[0].value : null,
      tax: results[1].status === 'fulfilled' ? results[1].value : null,
      errors: results.filter(r => r.status === 'rejected').map(r => (r as PromiseRejectedResult).reason),
    };
  }

  async cacheData(entityId: string, dataType: string, data: any, ttl: number = API_CONFIG.CACHE_DURATION) {
    try {
      await supabaseAdmin
        .from('data_cache')
        .upsert({
          entity_id: entityId,
          data_type: dataType,
          data: data,
          expires_at: new Date(Date.now() + ttl).toISOString(),
          updated_at: new Date().toISOString(),
        });
    } catch (error) {
      console.error('Cache storage error:', error);
    }
  }

  async getCachedData(entityId: string, dataType: string) {
    try {
      const { data, error } = await supabaseAdmin
        .from('data_cache')
        .select('data, expires_at')
        .eq('entity_id', entityId)
        .eq('data_type', dataType)
        .single();

      if (error || !data) return null;

      if (new Date(data.expires_at) < new Date()) {
        // Data expired, remove from cache
        await supabaseAdmin
          .from('data_cache')
          .delete()
          .eq('entity_id', entityId)
          .eq('data_type', dataType);
        return null;
      }

      return data.data;
    } catch (error) {
      console.error('Cache retrieval error:', error);
      return null;
    }
  }
}

// Export singleton instances
export const dataAggregationService = new DataAggregationService();
export const simahIntegration = new SIMAHIntegration();
export const gosiIntegration = new GOSIIntegration();
export const taxAuthorityIntegration = new TaxAuthorityIntegration();
export const alternativeDataIntegration = new AlternativeDataIntegration();