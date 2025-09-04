/**
 * KSA Lending Nervous System - Credit Scoring Engine
 * Real-time credit assessment with multi-entity support and alternative data integration
 */

import { Entity, Individual, Company, Institution, CreditAssessment, AssessmentFactor } from '@/lib/types';
import type {
  AlternativeDataPoint,
  AuditEntry,
  FraudCheckResult,
} from './types';

// Re-export for backward compatibility
export type { AuditEntry };

/*
// TEMP TYPES (commented - now using shared types)
// type PublicRecord = { type: string; date: string; severity?: string };
// type CreditInquiry = { source: string; date: string; hard?: boolean };
*/
type PublicRecord = { type: string; date: string; severity?: string };
type CreditInquiry = { source: string; date: string; hard?: boolean };

// Scoring configuration constants
export const SCORING_CONFIG = {
  BASE_SCORE_RANGE: { min: 350, max: 850 },
  PROCESSING_TIMEOUT: 50, // milliseconds
  CACHE_DURATION: 300000, // 5 minutes
  ACCURACY_THRESHOLD: 0.95,
} as const;

// Risk levels and thresholds
export const RISK_LEVELS = {
  VERY_LOW: { min: 750, max: 850, label: 'Very Low Risk' },
  LOW: { min: 650, max: 749, label: 'Low Risk' },
  MEDIUM: { min: 550, max: 649, label: 'Medium Risk' },
  HIGH: { min: 450, max: 549, label: 'High Risk' },
  VERY_HIGH: { min: 350, max: 449, label: 'Very High Risk' },
} as const;

// Scoring weights for different entity types
export const SCORING_WEIGHTS = {
  individual: {
    paymentHistory: 0.35,
    creditUtilization: 0.30,
    creditLength: 0.15,
    creditMix: 0.10,
    newCredit: 0.10,
    alternativeData: 0.20, // Bonus for thin-file users
  },
  company: {
    financialPerformance: 0.40,
    businessStability: 0.25,
    industryRisk: 0.15,
    managementQuality: 0.10,
    marketPosition: 0.10,
  },
  institution: {
    capitalAdequacy: 0.30,
    assetQuality: 0.25,
    governance: 0.20,
    profitability: 0.15,
    liquidity: 0.10,
  },
} as const;

// Alternative data sources and weights
const ALTERNATIVE_DATA_WEIGHTS: Record<AlternativeDataPoint['source'], number> = {
  telecom: 0.30,
  utilities: 0.25,
  digital_footprint: 0.20,
  social_media: 0.15,
  ecommerce: 0.10,
};

// Credit bureau data structure
export interface CreditBureauData {
  source: 'simah' | 'nccgr' | 'other';
  paymentHistory: PaymentRecord[];
  creditAccounts: CreditAccount[];
  publicRecords: PublicRecord[];
  inquiries: CreditInquiry[];
  lastUpdated: string;
}

export interface PaymentRecord {
  accountId: string;
  paymentDate: string;
  amountDue: number;
  amountPaid: number;
  daysLate: number;
  status: 'current' | 'late' | 'default' | 'charged_off';
}

export interface CreditAccount {
  accountId: string;
  accountType: 'credit_card' | 'loan' | 'mortgage' | 'line_of_credit';
  balance: number;
  creditLimit: number;
  monthlyPayment: number;
  openDate: string;
  status: 'open' | 'closed' | 'default';
}

/*
// Local AlternativeDataPoint commented - using shared type from ./types
// export interface AlternativeDataPoint {
//   source: keyof typeof ALTERNATIVE_DATA_WEIGHTS;
//   score: number;
//   confidence: number;
//   lastUpdated: string;
//   details: Record<string, any>;
// }
*/

export interface ScoringResult {
  score: number;
  riskLevel: keyof typeof RISK_LEVELS;
  probabilityOfDefault: number;
  factors: AssessmentFactor[];
  recommendations: string[];
  loanAmountRange: { min: number; max: number };
  suggestedInterestRate: { min: number; max: number };
  processingTime: number;
  confidence: number;
  auditTrail: AuditEntry[];
}

/*
// Local AuditEntry commented - using shared type from ./types
// export interface AuditEntry {
//   timestamp: string;
//   action: string;
//   component: string;
//   data: Record<string, any>;
//   userId?: string;
// }
*/

// Main Credit Scoring Engine Class
export class CreditScoringEngine {
  private cache: Map<string, { result: ScoringResult; timestamp: number }> = new Map();
  private auditTrail: AuditEntry[] = [];

  // Exhaustive check helper (safe to keep in production)
  private assertNever(x: never): never {
    throw new Error(`Unsupported entity type: ${(x as any)?.entity_type ?? 'unknown'}`);
  }

  /**
   * Main scoring function - routes to appropriate entity-specific scorer
   */
  async calculateCreditScore(
    entity: Entity,
    creditBureauData?: CreditBureauData,
    alternativeData?: AlternativeDataPoint[]
  ): Promise<ScoringResult> {
    const startTime = performance.now();
    
    try {
      // Check cache first
      const cacheKey = this.generateCacheKey(entity, creditBureauData, alternativeData);
      const cached = this.getCachedResult(cacheKey);
      if (cached) {
        this.addAuditEntry('CACHE_HIT', 'ScoringEngine', { entityId: entity.id });
        return cached;
      }

      // Route to appropriate scoring method
      let result: ScoringResult;
      switch (entity.entity_type) {
        case 'individual':
          result = await this.scoreIndividual(entity as Individual, creditBureauData, alternativeData);
          break;
        case 'company':
          result = await this.scoreCompany(entity as Company, creditBureauData, alternativeData);
          break;
        case 'institution':
          result = await this.scoreInstitution(entity as Institution, creditBureauData, alternativeData);
          break;
        default:
          // Enforce exhaustiveness at compile time
          return this.assertNever(entity as never);
      }

      const processingTime = performance.now() - startTime;
      result.processingTime = processingTime;
      result.auditTrail = [...this.auditTrail];

      // Validate processing time requirement
      if (processingTime > SCORING_CONFIG.PROCESSING_TIMEOUT) {
        console.warn(`Scoring exceeded timeout: ${processingTime}ms`);
      }

      // Cache the result
      this.cacheResult(cacheKey, result);

      this.addAuditEntry('SCORE_CALCULATED', 'ScoringEngine', {
        entityId: entity.id,
        score: result.score,
        processingTime,
      });

      return result;
    } catch (error) {
      this.addAuditEntry('SCORING_ERROR', 'ScoringEngine', {
        entityId: entity.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Individual credit scoring algorithm
   */
  private async scoreIndividual(
    individual: Individual,
    creditBureauData?: CreditBureauData,
    alternativeData?: AlternativeDataPoint[]
  ): Promise<ScoringResult> {
    const factors: AssessmentFactor[] = [];
    let baseScore = 500; // Starting point

    // Payment History (35% weight)
    const paymentHistoryScore = this.calculatePaymentHistory(creditBureauData?.paymentHistory || []);
    factors.push({
      category: 'Payment History',
      weight: SCORING_WEIGHTS.individual.paymentHistory,
      score: paymentHistoryScore,
      impact: paymentHistoryScore > 0.7 ? 'positive' : paymentHistoryScore < 0.3 ? 'negative' : 'neutral',
      description: 'Track record of on-time payments and credit management',
    });

    // Credit Utilization (30% weight)
    const utilizationScore = this.calculateCreditUtilization(creditBureauData?.creditAccounts || []);
    factors.push({
      category: 'Credit Utilization',
      weight: SCORING_WEIGHTS.individual.creditUtilization,
      score: utilizationScore,
      impact: utilizationScore > 0.7 ? 'positive' : utilizationScore < 0.3 ? 'negative' : 'neutral',
      description: 'Percentage of available credit currently being used',
    });

    // Employment Stability
    const employmentScore = this.calculateEmploymentStability(individual);
    factors.push({
      category: 'Employment Stability',
      weight: 0.15,
      score: employmentScore,
      impact: employmentScore > 0.7 ? 'positive' : 'neutral',
      description: 'Job stability and income consistency',
    });

    // Income-to-Debt Ratio
    const debtRatioScore = this.calculateDebtToIncomeRatio(individual);
    factors.push({
      category: 'Debt-to-Income Ratio',
      weight: 0.10,
      score: debtRatioScore,
      impact: debtRatioScore > 0.6 ? 'positive' : debtRatioScore < 0.3 ? 'negative' : 'neutral',
      description: 'Monthly debt payments relative to income',
    });

    // Alternative Data (for thin-file users)
    if (alternativeData && alternativeData.length > 0) {
      const altDataScore = this.calculateAlternativeDataScore(alternativeData);
      factors.push({
        category: 'Alternative Data',
        weight: SCORING_WEIGHTS.individual.alternativeData,
        score: altDataScore,
        impact: altDataScore > 0.6 ? 'positive' : 'neutral',
        description: 'Non-traditional credit indicators (telecom, utilities, digital behavior)',
      });
    }

    // Calculate weighted score
    const weightedScore = factors.reduce((total, factor) => {
      return total + (factor.score * factor.weight * 350); // Scale to 350-point range
    }, baseScore);

    const finalScore = Math.max(350, Math.min(850, Math.round(weightedScore)));
    const riskLevel = this.determineRiskLevel(finalScore);
    const probabilityOfDefault = this.calculateDefaultProbability(finalScore, factors);

    return {
      score: finalScore,
      riskLevel,
      probabilityOfDefault,
      factors,
      recommendations: this.generateRecommendations(factors, individual.entity_type),
      loanAmountRange: this.calculateLoanRange(finalScore, individual.monthly_income || 0),
      suggestedInterestRate: this.calculateInterestRate(finalScore, riskLevel),
      processingTime: 0, // Will be set by caller
      confidence: this.calculateConfidence(factors, creditBureauData, alternativeData),
      auditTrail: [],
    };
  }

  /**
   * Company credit scoring algorithm
   */
  private async scoreCompany(
    company: Company,
    creditBureauData?: CreditBureauData,
    alternativeData?: AlternativeDataPoint[]
  ): Promise<ScoringResult> {
    const factors: AssessmentFactor[] = [];
    let baseScore = 500;

    // Financial Performance (40% weight)
    const financialScore = this.calculateCompanyFinancialPerformance(company);
    factors.push({
      category: 'Financial Performance',
      weight: SCORING_WEIGHTS.company.financialPerformance,
      score: financialScore,
      impact: financialScore > 0.7 ? 'positive' : financialScore < 0.4 ? 'negative' : 'neutral',
      description: 'Revenue growth, profitability, and financial ratios',
    });

    // Business Stability (25% weight)
    const stabilityScore = this.calculateBusinessStability(company);
    factors.push({
      category: 'Business Stability',
      weight: SCORING_WEIGHTS.company.businessStability,
      score: stabilityScore,
      impact: stabilityScore > 0.6 ? 'positive' : 'neutral',
      description: 'Years in business, market position, and operational consistency',
    });

    // Industry Risk Assessment (15% weight)
    const industryScore = this.calculateIndustryRisk(company.industry_sector);
    factors.push({
      category: 'Industry Risk',
      weight: SCORING_WEIGHTS.company.industryRisk,
      score: industryScore,
      impact: industryScore > 0.6 ? 'positive' : industryScore < 0.4 ? 'negative' : 'neutral',
      description: 'Industry-specific risk factors and market conditions',
    });

    // Management Quality (10% weight)
    const managementScore = this.calculateManagementQuality(company);
    factors.push({
      category: 'Management Quality',
      weight: SCORING_WEIGHTS.company.managementQuality,
      score: managementScore,
      impact: managementScore > 0.7 ? 'positive' : 'neutral',
      description: 'Leadership experience and corporate governance',
    });

    // Calculate weighted score
    const weightedScore = factors.reduce((total, factor) => {
      return total + (factor.score * factor.weight * 350);
    }, baseScore);

    const finalScore = Math.max(350, Math.min(850, Math.round(weightedScore)));
    const riskLevel = this.determineRiskLevel(finalScore);
    const probabilityOfDefault = this.calculateDefaultProbability(finalScore, factors);

    return {
      score: finalScore,
      riskLevel,
      probabilityOfDefault,
      factors,
      recommendations: this.generateRecommendations(factors, company.entity_type),
      loanAmountRange: this.calculateBusinessLoanRange(finalScore, company.annual_revenue || 0),
      suggestedInterestRate: this.calculateInterestRate(finalScore, riskLevel),
      processingTime: 0,
      confidence: this.calculateConfidence(factors, creditBureauData, alternativeData),
      auditTrail: [],
    };
  }

  /**
   * Institution credit scoring algorithm
   */
  private async scoreInstitution(
    institution: Institution,
    creditBureauData?: CreditBureauData,
    alternativeData?: AlternativeDataPoint[]
  ): Promise<ScoringResult> {
    const factors: AssessmentFactor[] = [];
    let baseScore = 600; // Higher base for institutions

    // Capital Adequacy (30% weight)
    const capitalScore = this.calculateCapitalAdequacy(institution);
    factors.push({
      category: 'Capital Adequacy',
      weight: SCORING_WEIGHTS.institution.capitalAdequacy,
      score: capitalScore,
      impact: capitalScore > 0.8 ? 'positive' : capitalScore < 0.5 ? 'negative' : 'neutral',
      description: 'Capital adequacy ratio and regulatory compliance',
    });

    // Governance & Compliance (20% weight)
    const governanceScore = this.calculateGovernanceScore(institution);
    factors.push({
      category: 'Governance & Compliance',
      weight: SCORING_WEIGHTS.institution.governance,
      score: governanceScore,
      impact: governanceScore > 0.8 ? 'positive' : 'neutral',
      description: 'Regulatory compliance and corporate governance standards',
    });

    // Asset Quality (25% weight)
    const assetQualityScore = this.calculateAssetQuality(institution);
    factors.push({
      category: 'Asset Quality',
      weight: SCORING_WEIGHTS.institution.assetQuality,
      score: assetQualityScore,
      impact: assetQualityScore > 0.7 ? 'positive' : assetQualityScore < 0.4 ? 'negative' : 'neutral',
      description: 'Quality of loan portfolio and asset management',
    });

    // Calculate weighted score
    const weightedScore = factors.reduce((total, factor) => {
      return total + (factor.score * factor.weight * 250); // Smaller range for institutions
    }, baseScore);

    const finalScore = Math.max(350, Math.min(850, Math.round(weightedScore)));
    const riskLevel = this.determineRiskLevel(finalScore);
    const probabilityOfDefault = this.calculateDefaultProbability(finalScore, factors);

    return {
      score: finalScore,
      riskLevel,
      probabilityOfDefault,
      factors,
      recommendations: this.generateRecommendations(factors, institution.entity_type),
      loanAmountRange: this.calculateInstitutionalLoanRange(finalScore),
      suggestedInterestRate: this.calculateInterestRate(finalScore, riskLevel),
      processingTime: 0,
      confidence: this.calculateConfidence(factors, creditBureauData, alternativeData),
      auditTrail: [],
    };
  }

  // Individual scoring helper methods
  private calculatePaymentHistory(paymentHistory: PaymentRecord[]): number {
    if (paymentHistory.length === 0) return 0.5; // Neutral for no history

    const totalPayments = paymentHistory.length;
    const onTimePayments = paymentHistory.filter(p => p.daysLate === 0).length;
    const latePayments = paymentHistory.filter(p => p.daysLate > 0 && p.daysLate <= 30).length;
    const severelyLatePayments = paymentHistory.filter(p => p.daysLate > 30).length;

    // Weight recent payments more heavily
    const recentPayments = paymentHistory.slice(-12); // Last 12 payments
    const recentOnTime = recentPayments.filter(p => p.daysLate === 0).length;
    const recentScore = recentPayments.length > 0 ? recentOnTime / recentPayments.length : 0.5;

    const overallScore = onTimePayments / totalPayments;
    const penaltyForLate = (latePayments * 0.1 + severelyLatePayments * 0.3) / totalPayments;

    return Math.max(0, Math.min(1, (overallScore * 0.7 + recentScore * 0.3) - penaltyForLate));
  }

  private calculateCreditUtilization(creditAccounts: CreditAccount[]): number {
    const creditCards = creditAccounts.filter(acc => acc.accountType === 'credit_card');
    if (creditCards.length === 0) return 0.5; // Neutral for no credit cards

    const totalLimit = creditCards.reduce((sum, card) => sum + card.creditLimit, 0);
    const totalBalance = creditCards.reduce((sum, card) => sum + card.balance, 0);

    if (totalLimit === 0) return 0.5;

    const utilizationRatio = totalBalance / totalLimit;
    
    // Optimal utilization is below 30%, excellent is below 10%
    if (utilizationRatio <= 0.1) return 1.0;
    if (utilizationRatio <= 0.3) return 0.8;
    if (utilizationRatio <= 0.5) return 0.6;
    if (utilizationRatio <= 0.7) return 0.4;
    return 0.2;
  }

  private calculateEmploymentStability(individual: Individual): number {
    const employmentStatus = individual.employment_status;
    const monthlyIncome = individual.monthly_income || 0;

    let stabilityScore = 0.5; // Base score

    // Employment status scoring
    switch (employmentStatus) {
      case 'employed':
        stabilityScore = 0.8;
        break;
      case 'self_employed':
        stabilityScore = 0.6;
        break;
      case 'retired':
        stabilityScore = 0.7;
        break;
      case 'unemployed':
        stabilityScore = 0.2;
        break;
    }

    // Income level adjustment
    if (monthlyIncome >= 20000) stabilityScore += 0.1;
    else if (monthlyIncome >= 10000) stabilityScore += 0.05;
    else if (monthlyIncome < 3000) stabilityScore -= 0.2;

    return Math.max(0, Math.min(1, stabilityScore));
  }

  private calculateDebtToIncomeRatio(individual: Individual): number {
    const monthlyIncome = individual.monthly_income || 0;
    if (monthlyIncome === 0) return 0.3; // Low score for no income data

    // This would typically come from credit bureau data
    // For now, we'll estimate based on available information
    const estimatedMonthlyDebt = monthlyIncome * 0.3; // Assume 30% DTI as average
    const dtiRatio = estimatedMonthlyDebt / monthlyIncome;

    // Excellent DTI is below 20%, good is below 36%
    if (dtiRatio <= 0.2) return 1.0;
    if (dtiRatio <= 0.36) return 0.8;
    if (dtiRatio <= 0.5) return 0.6;
    if (dtiRatio <= 0.7) return 0.4;
    return 0.2;
  }

  private calculateAlternativeDataScore(alternativeData: AlternativeDataPoint[]): number {
    if (alternativeData.length === 0) return 0.5;

    let weightedScore = 0;
    let totalWeight = 0;

    alternativeData.forEach(dataPoint => {
      const weight = ALTERNATIVE_DATA_WEIGHTS[dataPoint.source] ?? 0.1;
      weightedScore += dataPoint.score * weight * dataPoint.confidence;
      totalWeight += weight;
    });

    return totalWeight > 0 ? weightedScore / totalWeight : 0.5;
  }

  // Company scoring helper methods
  private calculateCompanyFinancialPerformance(company: Company): number {
    const revenue = company.annual_revenue || 0;
    const employeeCount = company.employee_count || 0;
    
    let score = 0.5; // Base score

    // Revenue-based scoring
    if (revenue >= 10000000) score += 0.3; // 10M+ SAR
    else if (revenue >= 5000000) score += 0.2; // 5M+ SAR
    else if (revenue >= 1000000) score += 0.1; // 1M+ SAR
    else if (revenue < 100000) score -= 0.2; // Below 100K SAR

    // Employee count indicates business scale
    if (employeeCount >= 100) score += 0.1;
    else if (employeeCount >= 50) score += 0.05;
    else if (employeeCount < 5) score -= 0.1;

    // Industry-specific adjustments would go here
    // This is a simplified version
    return Math.max(0, Math.min(1, score));
  }

  private calculateBusinessStability(company: Company): number {
    const establishmentDate = new Date(company.establishment_date);
    const yearsInBusiness = (Date.now() - establishmentDate.getTime()) / (1000 * 60 * 60 * 24 * 365);

    let stabilityScore = 0.3; // Base score for new businesses

    // Years in business scoring
    if (yearsInBusiness >= 10) stabilityScore = 0.9;
    else if (yearsInBusiness >= 5) stabilityScore = 0.7;
    else if (yearsInBusiness >= 3) stabilityScore = 0.6;
    else if (yearsInBusiness >= 1) stabilityScore = 0.4;

    // Legal form stability
    switch (company.legal_form) {
      case 'joint_stock':
        stabilityScore += 0.1;
        break;
      case 'llc':
        stabilityScore += 0.05;
        break;
      case 'sole_proprietorship':
        stabilityScore -= 0.05;
        break;
    }

    return Math.max(0, Math.min(1, stabilityScore));
  }

  private calculateIndustryRisk(industrySector: string): number {
    // Industry risk mapping (simplified)
    const industryRiskMap: Record<string, number> = {
      'technology': 0.7,
      'healthcare': 0.8,
      'finance': 0.6,
      'education': 0.8,
      'manufacturing': 0.6,
      'retail': 0.5,
      'hospitality': 0.4,
      'oil_gas': 0.5,
      'construction': 0.4,
      'agriculture': 0.6,
    };

    return industryRiskMap[industrySector.toLowerCase()] || 0.5;
  }

  private calculateManagementQuality(company: Company): number {
    // This would typically involve more detailed analysis
    // For now, we'll use company age and size as proxies
    const establishmentDate = new Date(company.establishment_date);
    const yearsInBusiness = (Date.now() - establishmentDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
    const employeeCount = company.employee_count || 0;

    let managementScore = 0.5;

    if (yearsInBusiness >= 5 && employeeCount >= 20) managementScore = 0.8;
    else if (yearsInBusiness >= 3 && employeeCount >= 10) managementScore = 0.7;
    else if (yearsInBusiness >= 1) managementScore = 0.6;

    return managementScore;
  }

  // Institution scoring helper methods
  private calculateCapitalAdequacy(institution: Institution): number {
    const capitalRatio = institution.capital_adequacy_ratio || 0;
    
    // SAMA minimum is typically 8%, excellent is 15%+
    if (capitalRatio >= 15) return 1.0;
    if (capitalRatio >= 12) return 0.8;
    if (capitalRatio >= 10) return 0.7;
    if (capitalRatio >= 8) return 0.6;
    return 0.3; // Below regulatory minimum
  }

  private calculateGovernanceScore(institution: Institution): number {
    let governanceScore = 0.7; // Base score for licensed institutions

    // Regulatory authority scoring
    switch (institution.regulatory_authority) {
      case 'sama':
        governanceScore = 0.9; // Highest for SAMA regulation
        break;
      case 'cma':
        governanceScore = 0.8;
        break;
      case 'other':
        governanceScore = 0.6;
        break;
    }

    // Institution type adjustments
    switch (institution.institution_type) {
      case 'bank':
        governanceScore += 0.1;
        break;
      case 'finance_company':
        // No adjustment
        break;
      case 'microfinance':
        governanceScore -= 0.05;
        break;
      case 'cooperative':
        governanceScore -= 0.1;
        break;
    }

    return Math.max(0, Math.min(1, governanceScore));
  }

  private calculateAssetQuality(institution: Institution): number {
    // This would typically involve detailed portfolio analysis
    // For now, we'll use institution type and regulatory status as proxies
    const riskRating = institution.risk_rating || '';
    
    let assetScore = 0.6; // Base score

    // Risk rating scoring (assuming standard rating scale)
    if (riskRating.startsWith('AA')) assetScore = 0.9;
    else if (riskRating.startsWith('A')) assetScore = 0.8;
    else if (riskRating.startsWith('BBB')) assetScore = 0.7;
    else if (riskRating.startsWith('BB')) assetScore = 0.6;
    else if (riskRating.startsWith('B')) assetScore = 0.4;

    return assetScore;
  }

  // Common utility methods
  private determineRiskLevel(score: number): keyof typeof RISK_LEVELS {
    for (const [level, range] of Object.entries(RISK_LEVELS)) {
      if (score >= range.min && score <= range.max) {
        return level as keyof typeof RISK_LEVELS;
      }
    }
    return 'HIGH'; // Default fallback
  }

  private calculateDefaultProbability(score: number, factors: AssessmentFactor[]): number {
    // Simplified probability calculation based on score
    // In reality, this would use more sophisticated models
    const baseProb = Math.max(0.01, Math.min(0.5, (850 - score) / 1000));
    
    // Adjust based on negative factors
    const negativeFactor = factors.filter(f => f.impact === 'negative').length * 0.02;
    const positiveFactor = factors.filter(f => f.impact === 'positive').length * -0.01;
    
    return Math.max(0.005, Math.min(0.5, baseProb + negativeFactor + positiveFactor));
  }

  private generateRecommendations(factors: AssessmentFactor[], entityType: string): string[] {
    const recommendations: string[] = [];
    
    factors.forEach(factor => {
      if (factor.impact === 'negative' && factor.score < 0.4) {
        switch (factor.category) {
          case 'Payment History':
            recommendations.push('Improve payment history by making all payments on time');
            break;
          case 'Credit Utilization':
            recommendations.push('Reduce credit card balances to below 30% of credit limits');
            break;
          case 'Employment Stability':
            recommendations.push('Maintain stable employment and document income sources');
            break;
          case 'Financial Performance':
            recommendations.push('Focus on improving revenue growth and profitability ratios');
            break;
          case 'Capital Adequacy':
            recommendations.push('Increase capital reserves to meet regulatory requirements');
            break;
        }
      }
    });

    // Add general recommendations
    if (entityType === 'individual') {
      recommendations.push('Consider building credit history through secured credit products');
      recommendations.push('Maintain emergency savings equivalent to 3-6 months of expenses');
    } else if (entityType === 'company') {
      recommendations.push('Maintain detailed financial records and regular audits');
      recommendations.push('Diversify revenue streams to reduce business risk');
    }

    return recommendations;
  }

  private calculateLoanRange(score: number, monthlyIncome: number): { min: number; max: number } {
    const baseMultiplier = score >= 700 ? 5 : score >= 600 ? 3 : score >= 500 ? 2 : 1;
    const maxLoan = monthlyIncome * baseMultiplier * 12; // Annual income multiple
    
    return {
      min: Math.max(5000, maxLoan * 0.1), // Minimum 5K SAR
      max: Math.min(1000000, maxLoan), // Maximum 1M SAR for individuals
    };
  }

  private calculateBusinessLoanRange(score: number, annualRevenue: number): { min: number; max: number } {
    const baseMultiplier = score >= 700 ? 0.5 : score >= 600 ? 0.3 : score >= 500 ? 0.2 : 0.1;
    const maxLoan = annualRevenue * baseMultiplier;
    
    return {
      min: Math.max(50000, maxLoan * 0.1), // Minimum 50K SAR
      max: Math.min(10000000, maxLoan), // Maximum 10M SAR for businesses
    };
  }

  private calculateInstitutionalLoanRange(score: number): { min: number; max: number } {
    const baseAmount = score >= 700 ? 50000000 : score >= 600 ? 20000000 : 10000000;
    
    return {
      min: baseAmount * 0.1,
      max: baseAmount,
    };
  }

  private calculateInterestRate(score: number, riskLevel: keyof typeof RISK_LEVELS): { min: number; max: number } {
    // Base rates (simplified - would be based on SAMA rates + risk premium)
    const baseRates: Record<keyof typeof RISK_LEVELS, { min: number; max: number }> = {
      VERY_LOW: { min: 3.5, max: 5.0 },
      LOW: { min: 5.0, max: 7.0 },
      MEDIUM: { min: 7.0, max: 10.0 },
      HIGH: { min: 10.0, max: 15.0 },
      VERY_HIGH: { min: 15.0, max: 25.0 },
    };

    return baseRates[riskLevel];
  }

  private calculateConfidence(
    factors: AssessmentFactor[],
    creditBureauData?: CreditBureauData,
    alternativeData?: AlternativeDataPoint[]
  ): number {
    let confidence = 0.5; // Base confidence

    // Increase confidence with more data sources
    if (creditBureauData) confidence += 0.3;
    if (alternativeData && alternativeData.length > 0) confidence += 0.2;

    // Factor in data quality
    const avgFactorScore = factors.reduce((sum, f) => sum + f.score, 0) / factors.length;
    confidence += (avgFactorScore - 0.5) * 0.2;

    return Math.max(0.3, Math.min(1.0, confidence));
  }

  // Caching methods
  private generateCacheKey(
    entity: Entity,
    creditBureauData?: CreditBureauData,
    alternativeData?: AlternativeDataPoint[]
  ): string {
    const entityKey = `${entity.id}_${entity.updated_at}`;
    const bureauKey = creditBureauData ? `_${creditBureauData.lastUpdated}` : '';
    const altKey = alternativeData ? `_${alternativeData.length}` : '';
    return `${entityKey}${bureauKey}${altKey}`;
  }

  private getCachedResult(cacheKey: string): ScoringResult | null {
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < SCORING_CONFIG.CACHE_DURATION) {
      return cached.result;
    }
    return null;
  }

  private cacheResult(cacheKey: string, result: ScoringResult): void {
    this.cache.set(cacheKey, {
      result,
      timestamp: Date.now(),
    });
  }

  private addAuditEntry(action: string, component: string, data: Record<string, any>): void {
    this.auditTrail.push({
      entityId: data.entityId || 'unknown',
      timestamp: new Date().toISOString(),
      action,
      component,
      data,
    });
  }

  // Fraud detection methods
  async detectFraud(entity: Entity, scoringResult: ScoringResult): Promise<{
    riskScore: number;
    flags: string[];
    recommendation: 'approve' | 'review' | 'reject';
  }> {
    const flags: string[] = [];
    let riskScore = 0;

    // Check for suspicious patterns
    if (scoringResult.score > 750 && scoringResult.confidence < 0.5) {
      flags.push('High score with low confidence');
      riskScore += 0.3;
    }

    if (entity.entity_type === 'individual') {
      const individual = entity as Individual;
      
      // Check for unrealistic income
      if (individual.monthly_income && individual.monthly_income > 100000) {
        flags.push('Unusually high reported income');
        riskScore += 0.2;
      }
    }

    // Determine recommendation
    let recommendation: 'approve' | 'review' | 'reject' = 'approve';
    if (riskScore > 0.7) recommendation = 'reject';
    else if (riskScore > 0.3) recommendation = 'review';

    return { riskScore, flags, recommendation };
  }

  // API integration methods (mock implementations)
  async fetchCreditBureauData(entityId: string, bureauType: 'simah' | 'nccgr'): Promise<CreditBureauData | null> {
    // Mock implementation - would integrate with actual APIs
    await new Promise(resolve => setTimeout(resolve, 100)); // Simulate API delay

    return {
      source: bureauType,
      paymentHistory: [],
      creditAccounts: [],
      publicRecords: [],
      inquiries: [],
      lastUpdated: new Date().toISOString(),
    };
  }

  async fetchGovernmentData(entityId: string, entityType: string): Promise<Record<string, any> | null> {
    // Mock implementation for GOSI, Tax Authority data
    await new Promise(resolve => setTimeout(resolve, 150));

    return {
      employmentHistory: [],
      taxRecords: [],
      socialInsuranceData: [],
      lastUpdated: new Date().toISOString(),
    };
  }

  async fetchAlternativeData(entityId: string): Promise<AlternativeDataPoint[]> {
    // Mock implementation for telecom, utility data
    await new Promise(resolve => setTimeout(resolve, 200));

    return [
      {
        source: 'telecom',
        provider: 'stc',
        dataType: 'payment_history',
        score: 0.8,
        confidence: 0.9,
        lastUpdated: new Date().toISOString(),
        details: { avgPaymentDelay: 2, missedPayments: 0 },
        collectionDate: new Date().toISOString(),
      },
      {
        source: 'utilities',
        provider: 'seco',
        dataType: 'payment_history',
        score: 0.7,
        confidence: 0.8,
        lastUpdated: new Date().toISOString(),
        details: { avgPaymentDelay: 5, missedPayments: 1 },
        collectionDate: new Date().toISOString(),
      },
    ];
  }
}

// Export singleton instance
export const creditScoringEngine = new CreditScoringEngine();

// Export utility functions
export function formatScore(score: number): string {
  return score.toString();
}

export function formatRiskLevel(riskLevel: keyof typeof RISK_LEVELS): string {
  return RISK_LEVELS[riskLevel].label;
}

export function formatProbability(probability: number): string {
  return `${(probability * 100).toFixed(1)}%`;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ar-SA', {
    style: 'currency',
    currency: 'SAR',
  }).format(amount);
}

export function formatInterestRate(rate: number): string {
  return `${rate.toFixed(2)}%`;
}