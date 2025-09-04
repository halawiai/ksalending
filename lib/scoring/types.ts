/**
 * Credit Scoring Engine Types
 * Comprehensive type definitions for the KSA Lending Nervous System scoring engine
 */

export interface ScoringRequest {
  entityId: string;
  entityType: 'individual' | 'company' | 'institution';
  assessmentType: 'loan_application' | 'credit_review' | 'risk_evaluation';
  requestedAmount?: number;
  loanPurpose?: string;
  includeFraudCheck?: boolean;
  includeAlternativeData?: boolean;
}

export interface ScoringResponse {
  entityId: string;
  assessmentId: string;
  score: number;
  riskLevel: 'VERY_LOW' | 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
  probabilityOfDefault: number;
  confidence: number;
  processingTime: number;
  factors: ScoringFactor[];
  recommendations: Recommendation[];
  loanDecision: LoanDecision;
  fraudCheck?: FraudCheckResult;
  auditTrail: AuditEntry[];
  createdAt: string;
  expiresAt: string;
}

export interface ScoringFactor {
  category: string;
  subcategory?: string;
  weight: number;
  score: number;
  impact: 'positive' | 'negative' | 'neutral';
  description: string;
  dataSource: 'credit_bureau' | 'alternative_data' | 'government' | 'self_reported';
  confidence: number;
  lastUpdated: string;
}

export interface Recommendation {
  type: 'improvement' | 'warning' | 'opportunity';
  priority: 'high' | 'medium' | 'low';
  category: string;
  title: string;
  description: string;
  actionItems: string[];
  estimatedImpact: number; // Expected score improvement
  timeframe: string;
}

// Fraud flags (unify; comment any duplicate definitions)
export type FraudFlag =
  | 'velocity_check'
  | 'blacklist_match'
  | 'kyc_mismatch'
  | 'device_fingerprint_anomaly'
  | 'ip_geo_risk'
  | 'document_mismatch'
  | 'device_anomaly'
  | 'synthetic_identity';

// Fraud check result (add; routes and engine use this)
export interface FraudCheckResult {
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  confidence: number;
  flags: FraudFlag[];
  detectionMethods: string[];
  recommendation: 'approve' | 'review' | 'reject';
}

export interface LoanDecision {
  decision: 'approved' | 'conditional' | 'declined';
  approvedAmount: number;
  maxAmount: number;
  interestRateRange?: { min: number; max: number };
  termOptions?: number[];
  // interestRateRange: { min: number; max: number }; // Commented duplicate
  // termOptions: number[]; // Available loan terms in months // Commented duplicate
  conditions: string[];
  validUntil: string;
  fraudCheck?: FraudCheckResult;
}

// Commented out duplicate FraudFlag interface to avoid naming conflict
// export interface FraudFlag {
//   type: 'identity' | 'financial' | 'behavioral' | 'document';
//   severity: 'low' | 'medium' | 'high' | 'critical';
//   description: string;
//   evidence: Record<string, any>;
//   confidence: number;
// }

export interface AuditEntry {
  entityId: string;
  timestamp: string;
  action: string;
  component: string;
  data: Record<string, any>;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
}

// Data source interfaces
export interface CreditBureauResponse {
  bureauId: string;
  entityId: string;
  reportType: 'full' | 'summary' | 'monitoring';
  creditScore?: number;
  paymentHistory: PaymentHistoryRecord[];
  creditAccounts: CreditAccountRecord[];
  publicRecords: PublicRecord[];
  inquiries: CreditInquiry[];
  alerts: CreditAlert[];
  lastUpdated: string;
  nextUpdateDue: string;
}

export interface PaymentHistoryRecord {
  accountId: string;
  creditorName: string;
  accountType: string;
  paymentDate: string;
  amountDue: number;
  amountPaid: number;
  daysLate: number;
  status: 'current' | 'late_30' | 'late_60' | 'late_90' | 'default' | 'charged_off';
  reportingDate: string;
}

export interface CreditAccountRecord {
  accountId: string;
  creditorName: string;
  accountType: 'credit_card' | 'personal_loan' | 'mortgage' | 'auto_loan' | 'line_of_credit';
  balance: number;
  creditLimit?: number;
  monthlyPayment: number;
  interestRate?: number;
  openDate: string;
  lastPaymentDate?: string;
  status: 'open' | 'closed' | 'paid_off' | 'default' | 'transferred';
  paymentHistory: string; // e.g., "CCCCCCCCCCC" for current payments
}

export interface PublicRecord {
  recordType: 'bankruptcy' | 'judgment' | 'lien' | 'foreclosure';
  filingDate: string;
  amount?: number;
  status: 'active' | 'satisfied' | 'dismissed';
  court?: string;
  caseNumber?: string;
}

export interface CreditInquiry {
  inquiryDate: string;
  inquirerName: string;
  inquiryType: 'hard' | 'soft';
  purpose: string;
  amount?: number;
}

export interface CreditAlert {
  alertType: 'new_account' | 'address_change' | 'inquiry' | 'fraud_alert';
  date: string;
  description: string;
  severity: 'info' | 'warning' | 'critical';
}

export interface GovernmentDataResponse {
  entityId: string;
  dataSource: 'gosi' | 'tax_authority' | 'ministry_commerce' | 'sama';
  employmentHistory?: EmploymentRecord[];
  taxRecords?: TaxRecord[];
  businessRegistration?: BusinessRegistration;
  socialInsurance?: SocialInsuranceRecord;
  lastUpdated: string;
}

export interface EmploymentRecord {
  employerId: string;
  employerName: string;
  startDate: string;
  endDate?: string;
  position: string;
  salary: number;
  status: 'active' | 'terminated' | 'resigned';
}

export interface TaxRecord {
  taxYear: number;
  filingDate: string;
  taxableIncome: number;
  taxPaid: number;
  status: 'filed' | 'pending' | 'audited';
  refund?: number;
}

export interface BusinessRegistration {
  registrationNumber: string;
  businessName: string;
  legalForm: string;
  registrationDate: string;
  status: 'active' | 'suspended' | 'cancelled';
  activities: string[];
  authorizedCapital: number;
}

export interface SocialInsuranceRecord {
  subscriberNumber: string;
  contributionHistory: ContributionRecord[];
  totalContributions: number;
  eligibleBenefits: string[];
}

export interface ContributionRecord {
  month: string;
  employer: string;
  salary: number;
  contribution: number;
  status: 'paid' | 'pending' | 'defaulted';
}

export interface AlternativeDataResponse {
  entityId: string;
  dataPoints: AlternativeDataPoint[];
  aggregatedScore: number;
  confidence: number;
  lastUpdated: string;
}

export interface AlternativeDataPoint {
  source: 'telecom' | 'utilities' | 'digital_footprint' | 'social_media' | 'ecommerce';
  provider: string;
  dataType: string;
  score: number;
  confidence: number;
  lastUpdated: string; // ISO format - required for engine compatibility
  details: Record<string, any>;
  collectionDate: string;
  expiryDate?: string;
}

// Scoring model interfaces
export interface ScoringModel {
  modelId: string;
  modelName: string;
  version: string;
  entityType: 'individual' | 'company' | 'institution';
  algorithm: 'logistic_regression' | 'random_forest' | 'neural_network' | 'ensemble';
  features: ModelFeature[];
  performance: ModelPerformance;
  lastTrained: string;
  isActive: boolean;
}

export interface ModelFeature {
  name: string;
  type: 'numerical' | 'categorical' | 'boolean';
  weight: number;
  importance: number;
  dataSource: string;
  transformations: string[];
}

export interface ModelPerformance {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  auc: number;
  giniCoefficient: number;
  ks: number;
  testDataSize: number;
  validationDate: string;
}

// Configuration interfaces
export interface ScoringConfiguration {
  entityType: 'individual' | 'company' | 'institution';
  modelWeights: Record<string, number>;
  thresholds: {
    approval: number;
    review: number;
    decline: number;
  };
  fraudThresholds: {
    low: number;
    medium: number;
    high: number;
  };
  dataRequirements: {
    required: string[];
    optional: string[];
    alternativeData: boolean;
  };
  processingLimits: {
    maxProcessingTime: number;
    cacheTimeout: number;
    retryAttempts: number;
  };
}

// API interfaces
export interface ScoringAPIRequest {
  entityId: string;
  assessmentType: 'loan_application' | 'credit_review' | 'risk_evaluation';
  configuration?: Partial<ScoringConfiguration>;
  options?: {
    includeFraudCheck?: boolean;
    includeAlternativeData?: boolean;
    includeRecommendations?: boolean;
    cacheResults?: boolean;
  };
}

export interface ScoringAPIResponse {
  success: boolean;
  data?: ScoringResponse;
  error?: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
  metadata: {
    requestId: string;
    processingTime: number;
    apiVersion: string;
    timestamp: string;
  };
}

// Batch processing interfaces
export interface BatchScoringRequest {
  batchId: string;
  entities: string[];
  assessmentType: 'loan_application' | 'credit_review' | 'risk_evaluation';
  configuration?: Partial<ScoringConfiguration>;
  priority: 'low' | 'normal' | 'high';
  callbackUrl?: string;
}

export interface BatchScoringResponse {
  batchId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  totalEntities: number;
  processedEntities: number;
  failedEntities: number;
  results: ScoringResponse[];
  errors: BatchError[];
  startedAt: string;
  completedAt?: string;
  estimatedCompletion?: string;
}

export interface BatchError {
  entityId: string;
  error: string;
  details?: Record<string, any>;
}

// Monitoring and analytics interfaces
export interface ScoringMetrics {
  period: 'hour' | 'day' | 'week' | 'month';
  startDate: string;
  endDate: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageProcessingTime: number;
  scoreDistribution: Record<string, number>;
  riskDistribution: Record<string, number>;
  fraudDetectionRate: number;
  modelAccuracy: number;
}

export interface ScoringAlert {
  alertId: string;
  type: 'performance' | 'fraud' | 'system' | 'data_quality';
  severity: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  description: string;
  entityId?: string;
  modelId?: string;
  triggeredAt: string;
  resolvedAt?: string;
  actions: string[];
}