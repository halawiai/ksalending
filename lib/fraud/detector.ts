/**
 * AI-Powered Fraud Detection System
 * Real-time fraud detection with ML anomaly detection and behavioral analysis
 */

import { supabaseAdmin } from '@/lib/supabase/admin';
import { Entity, Individual, Company, Institution } from '@/lib/types';

// Fraud detection configuration
export const FRAUD_CONFIG = {
  VELOCITY_LIMITS: {
    APPLICATIONS_PER_HOUR: 5,
    APPLICATIONS_PER_DAY: 20,
    UNIQUE_IPS_PER_HOUR: 3,
  },
  RISK_THRESHOLDS: {
    LOW: 25,
    MEDIUM: 50,
    HIGH: 75,
    CRITICAL: 90,
  },
  CONFIDENCE_LEVELS: {
    LOW: 0.6,
    MEDIUM: 0.75,
    HIGH: 0.9,
  },
  GEOLOCATION_RADIUS_KM: 100,
  BLACKLIST_DURATION_HOURS: 24,
} as const;

// Fraud indicator types
export interface FraudIndicator {
  id: string;
  entity_id: string;
  indicator_type: 'velocity' | 'device' | 'geolocation' | 'behavioral' | 'identity' | 'financial' | 'document';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  confidence: number;
  evidence: Record<string, any>;
  detected_at: string;
  status: 'active' | 'resolved' | 'false_positive';
  resolved_by?: string;
  resolved_at?: string;
}

export interface FraudAssessment {
  entity_id: string;
  overall_risk_score: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  indicators: FraudIndicator[];
  recommended_action: 'approve' | 'review' | 'reject' | 'block';
  processing_time_ms: number;
  model_version: string;
}

export interface DeviceFingerprint {
  user_agent: string;
  screen_resolution: string;
  timezone: string;
  language: string;
  platform: string;
  canvas_hash?: string;
  webgl_hash?: string;
  audio_hash?: string;
}

export interface GeolocationData {
  ip_address: string;
  country: string;
  region: string;
  city: string;
  latitude: number;
  longitude: number;
  isp: string;
  is_proxy: boolean;
  is_vpn: boolean;
  risk_score: number;
}

export interface VelocityCheck {
  entity_id: string;
  ip_address: string;
  applications_last_hour: number;
  applications_last_day: number;
  unique_ips_last_hour: number;
  first_seen: string;
  last_seen: string;
}

export interface BehavioralPattern {
  typing_speed: number;
  form_completion_time: number;
  mouse_movements: number;
  copy_paste_events: number;
  tab_switches: number;
  suspicious_timing: boolean;
}

// Main Fraud Detection Engine
export class FraudDetectionEngine {
  private modelVersion = '1.0.0';
  private isolationForest: IsolationForest;
  private networkGraph: NetworkGraph;

  constructor() {
    this.isolationForest = new IsolationForest();
    this.networkGraph = new NetworkGraph();
  }

  /**
   * Main fraud detection entry point
   */
  async detectFraud(
    entity: Entity,
    deviceFingerprint?: DeviceFingerprint,
    geolocation?: GeolocationData,
    behavioral?: BehavioralPattern,
    ipAddress?: string
  ): Promise<FraudAssessment> {
    const startTime = performance.now();
    const indicators: FraudIndicator[] = [];

    try {
      // Run parallel fraud checks
      const [
        velocityIndicators,
        deviceIndicators,
        geolocationIndicators,
        behavioralIndicators,
        identityIndicators,
        financialIndicators,
        networkIndicators,
      ] = await Promise.all([
        this.checkVelocity(entity.id, ipAddress),
        this.checkDeviceFingerprint(entity.id, deviceFingerprint),
        this.checkGeolocation(entity.id, geolocation),
        this.checkBehavioralPatterns(behavioral),
        this.checkIdentityConsistency(entity),
        this.checkFinancialAnomalies(entity),
        this.checkNetworkConnections(entity.id, ipAddress),
      ]);

      // Combine all indicators
      indicators.push(
        ...velocityIndicators,
        ...deviceIndicators,
        ...geolocationIndicators,
        ...behavioralIndicators,
        ...identityIndicators,
        ...financialIndicators,
        ...networkIndicators
      );

      // Run ML anomaly detection
      const anomalyScore = await this.runAnomalyDetection(entity, indicators);
      if (anomalyScore > 0.7) {
        indicators.push({
          id: `anomaly_${Date.now()}`,
          entity_id: entity.id,
          indicator_type: 'behavioral',
          severity: anomalyScore > 0.9 ? 'critical' : 'high',
          description: 'ML anomaly detection flagged unusual patterns',
          confidence: anomalyScore,
          evidence: { anomaly_score: anomalyScore },
          detected_at: new Date().toISOString(),
          status: 'active',
        });
      }

      // Calculate overall risk score
      const riskScore = this.calculateRiskScore(indicators);
      const riskLevel = this.determineRiskLevel(riskScore);
      const confidence = this.calculateConfidence(indicators);
      const recommendedAction = this.determineAction(riskScore, confidence);

      // Store fraud indicators
      await this.storeFraudIndicators(indicators);

      // Log fraud assessment
      await this.logFraudAssessment(entity.id, riskScore, indicators.length);

      const processingTime = performance.now() - startTime;

      const assessment: FraudAssessment = {
        entity_id: entity.id,
        overall_risk_score: riskScore,
        risk_level: riskLevel,
        confidence,
        indicators,
        recommended_action: recommendedAction,
        processing_time_ms: Math.round(processingTime),
        model_version: this.modelVersion,
      };

      // Handle high-risk cases
      if (riskLevel === 'critical' || riskLevel === 'high') {
        await this.handleHighRiskCase(assessment);
      }

      return assessment;

    } catch (error) {
      console.error('Fraud detection error:', error);
      
      // Return safe default assessment
      return {
        entity_id: entity.id,
        overall_risk_score: 50,
        risk_level: 'medium',
        confidence: 0.5,
        indicators: [],
        recommended_action: 'review',
        processing_time_ms: Math.round(performance.now() - startTime),
        model_version: this.modelVersion,
      };
    }
  }

  /**
   * Velocity checks - detect rapid-fire applications
   */
  private async checkVelocity(entityId: string, ipAddress?: string): Promise<FraudIndicator[]> {
    const indicators: FraudIndicator[] = [];
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    try {
      // Check application velocity by entity
      const { data: recentApplications } = await supabaseAdmin
        .from('assessments')
        .select('created_at, entity_id')
        .eq('entity_id', entityId)
        .gte('created_at', oneDayAgo.toISOString());

      const applicationsLastHour = recentApplications?.filter(
        app => new Date(app.created_at) > oneHourAgo
      ).length || 0;

      const applicationsLastDay = recentApplications?.length || 0;

      if (applicationsLastHour > FRAUD_CONFIG.VELOCITY_LIMITS.APPLICATIONS_PER_HOUR) {
        indicators.push({
          id: `velocity_hour_${Date.now()}`,
          entity_id: entityId,
          indicator_type: 'velocity',
          severity: 'high',
          description: `Excessive applications in last hour: ${applicationsLastHour}`,
          confidence: 0.9,
          evidence: { applications_last_hour: applicationsLastHour },
          detected_at: now.toISOString(),
          status: 'active',
        });
      }

      if (applicationsLastDay > FRAUD_CONFIG.VELOCITY_LIMITS.APPLICATIONS_PER_DAY) {
        indicators.push({
          id: `velocity_day_${Date.now()}`,
          entity_id: entityId,
          indicator_type: 'velocity',
          severity: 'medium',
          description: `Excessive applications in last day: ${applicationsLastDay}`,
          confidence: 0.8,
          evidence: { applications_last_day: applicationsLastDay },
          detected_at: now.toISOString(),
          status: 'active',
        });
      }

      // Check IP velocity if available
      if (ipAddress) {
        const { data: ipApplications } = await supabaseAdmin
          .from('api_audit_logs')
          .select('created_at, ip_address')
          .eq('ip_address', ipAddress)
          .gte('created_at', oneHourAgo.toISOString());

        const ipApplicationsLastHour = ipApplications?.length || 0;

        if (ipApplicationsLastHour > FRAUD_CONFIG.VELOCITY_LIMITS.APPLICATIONS_PER_HOUR) {
          indicators.push({
            id: `ip_velocity_${Date.now()}`,
            entity_id: entityId,
            indicator_type: 'velocity',
            severity: 'high',
            description: `Excessive applications from IP in last hour: ${ipApplicationsLastHour}`,
            confidence: 0.85,
            evidence: { ip_applications_last_hour: ipApplicationsLastHour, ip_address: ipAddress },
            detected_at: now.toISOString(),
            status: 'active',
          });
        }
      }

    } catch (error) {
      console.error('Velocity check error:', error);
    }

    return indicators;
  }

  /**
   * Device fingerprinting analysis
   */
  private async checkDeviceFingerprint(
    entityId: string, 
    fingerprint?: DeviceFingerprint
  ): Promise<FraudIndicator[]> {
    const indicators: FraudIndicator[] = [];

    if (!fingerprint) return indicators;

    try {
      // Check for suspicious user agents
      const suspiciousAgents = ['bot', 'crawler', 'spider', 'scraper'];
      const isSuspiciousAgent = suspiciousAgents.some(agent => 
        fingerprint.user_agent.toLowerCase().includes(agent)
      );

      if (isSuspiciousAgent) {
        indicators.push({
          id: `device_agent_${Date.now()}`,
          entity_id: entityId,
          indicator_type: 'device',
          severity: 'high',
          description: 'Suspicious user agent detected',
          confidence: 0.9,
          evidence: { user_agent: fingerprint.user_agent },
          detected_at: new Date().toISOString(),
          status: 'active',
        });
      }

      // Check for device fingerprint reuse
      const fingerprintHash = this.generateFingerprintHash(fingerprint);
      const { data: existingFingerprints } = await supabaseAdmin
        .from('device_fingerprints')
        .select('entity_id, created_at')
        .eq('fingerprint_hash', fingerprintHash)
        .neq('entity_id', entityId);

      if (existingFingerprints && existingFingerprints.length > 0) {
        indicators.push({
          id: `device_reuse_${Date.now()}`,
          entity_id: entityId,
          indicator_type: 'device',
          severity: 'medium',
          description: `Device fingerprint used by ${existingFingerprints.length} other entities`,
          confidence: 0.75,
          evidence: { 
            fingerprint_hash: fingerprintHash,
            other_entities: existingFingerprints.length 
          },
          detected_at: new Date().toISOString(),
          status: 'active',
        });
      }

      // Store fingerprint for future analysis
      await supabaseAdmin
        .from('device_fingerprints')
        .upsert({
          entity_id: entityId,
          fingerprint_hash: fingerprintHash,
          fingerprint_data: fingerprint,
          created_at: new Date().toISOString(),
        });

    } catch (error) {
      console.error('Device fingerprint check error:', error);
    }

    return indicators;
  }

  /**
   * Geolocation analysis
   */
  private async checkGeolocation(
    entityId: string, 
    geolocation?: GeolocationData
  ): Promise<FraudIndicator[]> {
    const indicators: FraudIndicator[] = [];

    if (!geolocation) return indicators;

    try {
      // Check for high-risk countries/regions
      const highRiskCountries = ['XX', 'YY']; // Would be configured based on risk data
      if (highRiskCountries.includes(geolocation.country)) {
        indicators.push({
          id: `geo_country_${Date.now()}`,
          entity_id: entityId,
          indicator_type: 'geolocation',
          severity: 'medium',
          description: `Application from high-risk country: ${geolocation.country}`,
          confidence: 0.7,
          evidence: { country: geolocation.country, city: geolocation.city },
          detected_at: new Date().toISOString(),
          status: 'active',
        });
      }

      // Check for VPN/Proxy usage
      if (geolocation.is_vpn || geolocation.is_proxy) {
        indicators.push({
          id: `geo_proxy_${Date.now()}`,
          entity_id: entityId,
          indicator_type: 'geolocation',
          severity: 'medium',
          description: 'VPN or proxy detected',
          confidence: 0.8,
          evidence: { 
            is_vpn: geolocation.is_vpn, 
            is_proxy: geolocation.is_proxy,
            isp: geolocation.isp 
          },
          detected_at: new Date().toISOString(),
          status: 'active',
        });
      }

      // Check for impossible travel (rapid location changes)
      const { data: recentLocations } = await supabaseAdmin
        .from('geolocation_history')
        .select('*')
        .eq('entity_id', entityId)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(5);

      if (recentLocations && recentLocations.length > 0) {
        const lastLocation = recentLocations[0];
        const distance = this.calculateDistance(
          lastLocation.latitude, lastLocation.longitude,
          geolocation.latitude, geolocation.longitude
        );
        const timeDiff = (new Date().getTime() - new Date(lastLocation.created_at).getTime()) / (1000 * 60 * 60);
        const maxPossibleSpeed = distance / timeDiff; // km/h

        if (maxPossibleSpeed > 1000) { // Impossible travel speed
          indicators.push({
            id: `geo_travel_${Date.now()}`,
            entity_id: entityId,
            indicator_type: 'geolocation',
            severity: 'high',
            description: 'Impossible travel detected',
            confidence: 0.95,
            evidence: { 
              distance_km: distance,
              time_hours: timeDiff,
              speed_kmh: maxPossibleSpeed 
            },
            detected_at: new Date().toISOString(),
            status: 'active',
          });
        }
      }

      // Store location for future analysis
      await supabaseAdmin
        .from('geolocation_history')
        .insert({
          entity_id: entityId,
          ip_address: geolocation.ip_address,
          country: geolocation.country,
          region: geolocation.region,
          city: geolocation.city,
          latitude: geolocation.latitude,
          longitude: geolocation.longitude,
          created_at: new Date().toISOString(),
        });

    } catch (error) {
      console.error('Geolocation check error:', error);
    }

    return indicators;
  }

  /**
   * Behavioral pattern analysis
   */
  private async checkBehavioralPatterns(behavioral?: BehavioralPattern): Promise<FraudIndicator[]> {
    const indicators: FraudIndicator[] = [];

    if (!behavioral) return indicators;

    try {
      // Check for bot-like behavior
      if (behavioral.typing_speed > 200) { // Very fast typing
        indicators.push({
          id: `behavior_typing_${Date.now()}`,
          entity_id: 'unknown',
          indicator_type: 'behavioral',
          severity: 'medium',
          description: 'Unusually fast typing speed detected',
          confidence: 0.7,
          evidence: { typing_speed: behavioral.typing_speed },
          detected_at: new Date().toISOString(),
          status: 'active',
        });
      }

      // Check for suspiciously fast form completion
      if (behavioral.form_completion_time < 30) { // Less than 30 seconds
        indicators.push({
          id: `behavior_speed_${Date.now()}`,
          entity_id: 'unknown',
          indicator_type: 'behavioral',
          severity: 'medium',
          description: 'Suspiciously fast form completion',
          confidence: 0.75,
          evidence: { completion_time: behavioral.form_completion_time },
          detected_at: new Date().toISOString(),
          status: 'active',
        });
      }

      // Check for excessive copy-paste
      if (behavioral.copy_paste_events > 10) {
        indicators.push({
          id: `behavior_paste_${Date.now()}`,
          entity_id: 'unknown',
          indicator_type: 'behavioral',
          severity: 'low',
          description: 'Excessive copy-paste activity',
          confidence: 0.6,
          evidence: { copy_paste_events: behavioral.copy_paste_events },
          detected_at: new Date().toISOString(),
          status: 'active',
        });
      }

      // Check for suspicious timing patterns
      if (behavioral.suspicious_timing) {
        indicators.push({
          id: `behavior_timing_${Date.now()}`,
          entity_id: 'unknown',
          indicator_type: 'behavioral',
          severity: 'medium',
          description: 'Suspicious timing patterns detected',
          confidence: 0.8,
          evidence: { suspicious_timing: true },
          detected_at: new Date().toISOString(),
          status: 'active',
        });
      }

    } catch (error) {
      console.error('Behavioral pattern check error:', error);
    }

    return indicators;
  }

  /**
   * Identity consistency checks
   */
  private async checkIdentityConsistency(entity: Entity): Promise<FraudIndicator[]> {
    const indicators: FraudIndicator[] = [];

    try {
      if (entity.entity_type === 'individual') {
        const individual = entity as Individual;
        
        // Check for identity data inconsistencies
        if (individual.first_name && individual.last_name) {
          const fullName = `${individual.first_name} ${individual.last_name}`.toLowerCase();
          
          // Check against known fraudulent name patterns
          const suspiciousPatterns = ['test', 'fake', 'dummy', 'sample'];
          const hasSuspiciousPattern = suspiciousPatterns.some(pattern => 
            fullName.includes(pattern)
          );

          if (hasSuspiciousPattern) {
            indicators.push({
              id: `identity_name_${Date.now()}`,
              entity_id: entity.id,
              indicator_type: 'identity',
              severity: 'high',
              description: 'Suspicious name pattern detected',
              confidence: 0.85,
              evidence: { full_name: fullName },
              detected_at: new Date().toISOString(),
              status: 'active',
            });
          }
        }

        // Check for duplicate national IDs
        const { data: duplicateIds } = await supabaseAdmin
          .from('individual_profiles')
          .select('entity_id')
          .eq('national_id', individual.national_id)
          .neq('entity_id', entity.id);

        if (duplicateIds && duplicateIds.length > 0) {
          indicators.push({
            id: `identity_duplicate_${Date.now()}`,
            entity_id: entity.id,
            indicator_type: 'identity',
            severity: 'critical',
            description: 'Duplicate national ID detected',
            confidence: 0.95,
            evidence: { 
              national_id: individual.national_id,
              duplicate_count: duplicateIds.length 
            },
            detected_at: new Date().toISOString(),
            status: 'active',
          });
        }

        // Age validation
        if (individual.date_of_birth) {
          const age = this.calculateAge(individual.date_of_birth);
          if (age < 18 || age > 100) {
            indicators.push({
              id: `identity_age_${Date.now()}`,
              entity_id: entity.id,
              indicator_type: 'identity',
              severity: 'medium',
              description: `Suspicious age: ${age} years`,
              confidence: 0.8,
              evidence: { age, date_of_birth: individual.date_of_birth },
              detected_at: new Date().toISOString(),
              status: 'active',
            });
          }
        }
      }

    } catch (error) {
      console.error('Identity consistency check error:', error);
    }

    return indicators;
  }

  /**
   * Financial data anomaly detection
   */
  private async checkFinancialAnomalies(entity: Entity): Promise<FraudIndicator[]> {
    const indicators: FraudIndicator[] = [];

    try {
      if (entity.entity_type === 'individual') {
        const individual = entity as Individual;
        
        // Check for unrealistic income claims
        if (individual.monthly_income && individual.monthly_income > 100000) {
          indicators.push({
            id: `financial_income_${Date.now()}`,
            entity_id: entity.id,
            indicator_type: 'financial',
            severity: 'medium',
            description: 'Unusually high reported income',
            confidence: 0.7,
            evidence: { monthly_income: individual.monthly_income },
            detected_at: new Date().toISOString(),
            status: 'active',
          });
        }

        // Check for income-employment mismatch
        if (individual.employment_status === 'unemployed' && 
            individual.monthly_income && individual.monthly_income > 0) {
          indicators.push({
            id: `financial_mismatch_${Date.now()}`,
            entity_id: entity.id,
            indicator_type: 'financial',
            severity: 'high',
            description: 'Income reported despite unemployment status',
            confidence: 0.9,
            evidence: { 
              employment_status: individual.employment_status,
              monthly_income: individual.monthly_income 
            },
            detected_at: new Date().toISOString(),
            status: 'active',
          });
        }
      }

      if (entity.entity_type === 'company') {
        const company = entity as Company;
        
        // Check for unrealistic revenue claims
        if (company.annual_revenue && company.employee_count) {
          const revenuePerEmployee = company.annual_revenue / company.employee_count;
          
          if (revenuePerEmployee > 1000000) { // More than 1M SAR per employee
            indicators.push({
              id: `financial_revenue_${Date.now()}`,
              entity_id: entity.id,
              indicator_type: 'financial',
              severity: 'medium',
              description: 'Unusually high revenue per employee',
              confidence: 0.75,
              evidence: { 
                revenue_per_employee: revenuePerEmployee,
                annual_revenue: company.annual_revenue,
                employee_count: company.employee_count 
              },
              detected_at: new Date().toISOString(),
              status: 'active',
            });
          }
        }
      }

    } catch (error) {
      console.error('Financial anomaly check error:', error);
    }

    return indicators;
  }

  /**
   * Network connection analysis
   */
  private async checkNetworkConnections(entityId: string, ipAddress?: string): Promise<FraudIndicator[]> {
    const indicators: FraudIndicator[] = [];

    if (!ipAddress) return indicators;

    try {
      // Check for connections to known fraudulent networks
      const networkRisk = await this.networkGraph.analyzeConnections(entityId, ipAddress);
      
      if (networkRisk.risk_score > 0.7) {
        indicators.push({
          id: `network_risk_${Date.now()}`,
          entity_id: entityId,
          indicator_type: 'behavioral',
          severity: networkRisk.risk_score > 0.9 ? 'critical' : 'high',
          description: 'Connected to high-risk network',
          confidence: networkRisk.confidence,
          evidence: { 
            network_risk_score: networkRisk.risk_score,
            connected_entities: networkRisk.connected_entities 
          },
          detected_at: new Date().toISOString(),
          status: 'active',
        });
      }

    } catch (error) {
      console.error('Network connection check error:', error);
    }

    return indicators;
  }

  /**
   * ML Anomaly Detection using Isolation Forest
   */
  private async runAnomalyDetection(entity: Entity, indicators: FraudIndicator[]): Promise<number> {
    try {
      const features = this.extractFeatures(entity, indicators);
      return await this.isolationForest.predict(features);
    } catch (error) {
      console.error('Anomaly detection error:', error);
      return 0;
    }
  }

  /**
   * Calculate overall risk score
   */
  private calculateRiskScore(indicators: FraudIndicator[]): number {
    if (indicators.length === 0) return 0;

    const weights = {
      critical: 40,
      high: 25,
      medium: 15,
      low: 5,
    };

    const totalScore = indicators.reduce((sum, indicator) => {
      const weight = weights[indicator.severity];
      const confidenceAdjusted = weight * indicator.confidence;
      return sum + confidenceAdjusted;
    }, 0);

    // Normalize to 0-100 scale
    const maxPossibleScore = indicators.length * weights.critical;
    return Math.min(100, (totalScore / maxPossibleScore) * 100);
  }

  /**
   * Determine risk level from score
   */
  private determineRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score >= FRAUD_CONFIG.RISK_THRESHOLDS.CRITICAL) return 'critical';
    if (score >= FRAUD_CONFIG.RISK_THRESHOLDS.HIGH) return 'high';
    if (score >= FRAUD_CONFIG.RISK_THRESHOLDS.MEDIUM) return 'medium';
    return 'low';
  }

  /**
   * Calculate confidence level
   */
  private calculateConfidence(indicators: FraudIndicator[]): number {
    if (indicators.length === 0) return 0.5;

    const avgConfidence = indicators.reduce((sum, indicator) => 
      sum + indicator.confidence, 0) / indicators.length;
    
    // Adjust confidence based on number of indicators
    const indicatorBonus = Math.min(0.2, indicators.length * 0.05);
    
    return Math.min(1, avgConfidence + indicatorBonus);
  }

  /**
   * Determine recommended action
   */
  private determineAction(riskScore: number, confidence: number): 'approve' | 'review' | 'reject' | 'block' {
    if (riskScore >= 90 && confidence >= 0.9) return 'block';
    if (riskScore >= 75) return 'reject';
    if (riskScore >= 50) return 'review';
    return 'approve';
  }

  /**
   * Handle high-risk cases
   */
  private async handleHighRiskCase(assessment: FraudAssessment): Promise<void> {
    try {
      // Auto-block critical cases
      if (assessment.risk_level === 'critical' && assessment.confidence >= 0.9) {
        await this.addToBlacklist(assessment.entity_id, 'auto_block_critical_risk');
      }

      // Send alerts for high-risk cases
      await this.sendFraudAlert(assessment);

      // Create case for manual review
      await this.createFraudCase(assessment);

    } catch (error) {
      console.error('High-risk case handling error:', error);
    }
  }

  /**
   * Store fraud indicators in database
   */
  private async storeFraudIndicators(indicators: FraudIndicator[]): Promise<void> {
    if (indicators.length === 0) return;

    try {
      await supabaseAdmin
        .from('fraud_indicators')
        .insert(indicators);
    } catch (error) {
      console.error('Store fraud indicators error:', error);
    }
  }

  /**
   * Log fraud assessment
   */
  private async logFraudAssessment(entityId: string, riskScore: number, indicatorCount: number): Promise<void> {
    try {
      await supabaseAdmin
        .from('fraud_assessments')
        .insert({
          entity_id: entityId,
          risk_score: riskScore,
          indicator_count: indicatorCount,
          model_version: this.modelVersion,
          created_at: new Date().toISOString(),
        });
    } catch (error) {
      console.error('Log fraud assessment error:', error);
    }
  }

  /**
   * Add entity to blacklist
   */
  private async addToBlacklist(entityId: string, reason: string): Promise<void> {
    try {
      const expiresAt = new Date(Date.now() + FRAUD_CONFIG.BLACKLIST_DURATION_HOURS * 60 * 60 * 1000);
      
      await supabaseAdmin
        .from('blacklist')
        .insert({
          entity_id: entityId,
          reason,
          expires_at: expiresAt.toISOString(),
          created_at: new Date().toISOString(),
        });
    } catch (error) {
      console.error('Blacklist error:', error);
    }
  }

  /**
   * Send fraud alert
   */
  private async sendFraudAlert(assessment: FraudAssessment): Promise<void> {
    try {
      // This would integrate with notification systems
      console.log('Fraud alert:', {
        entity_id: assessment.entity_id,
        risk_level: assessment.risk_level,
        risk_score: assessment.overall_risk_score,
      });
    } catch (error) {
      console.error('Send fraud alert error:', error);
    }
  }

  /**
   * Create fraud case for investigation
   */
  private async createFraudCase(assessment: FraudAssessment): Promise<void> {
    try {
      await supabaseAdmin
        .from('fraud_cases')
        .insert({
          entity_id: assessment.entity_id,
          risk_score: assessment.overall_risk_score,
          risk_level: assessment.risk_level,
          indicator_count: assessment.indicators.length,
          status: 'open',
          priority: assessment.risk_level === 'critical' ? 'high' : 'medium',
          created_at: new Date().toISOString(),
        });
    } catch (error) {
      console.error('Create fraud case error:', error);
    }
  }

  // Utility methods
  private generateFingerprintHash(fingerprint: DeviceFingerprint): string {
    const data = `${fingerprint.user_agent}|${fingerprint.screen_resolution}|${fingerprint.timezone}|${fingerprint.language}`;
    return Buffer.from(data).toString('base64');
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private calculateAge(dateOfBirth: string): number {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }

  private extractFeatures(entity: Entity, indicators: FraudIndicator[]): number[] {
    // Extract numerical features for ML model
    const features = [
      indicators.length,
      indicators.filter(i => i.severity === 'critical').length,
      indicators.filter(i => i.severity === 'high').length,
      indicators.filter(i => i.severity === 'medium').length,
      indicators.filter(i => i.severity === 'low').length,
    ];

    if (entity.entity_type === 'individual') {
      const individual = entity as Individual;
      features.push(
        individual.monthly_income || 0,
        this.calculateAge(individual.date_of_birth || '1990-01-01'),
        individual.employment_status === 'employed' ? 1 : 0,
      );
    }

    return features;
  }
}

/**
 * Isolation Forest implementation for anomaly detection
 */
class IsolationForest {
  private trees: IsolationTree[] = [];
  private numTrees = 100;
  private sampleSize = 256;

  async predict(features: number[]): Promise<number> {
    // Simplified isolation forest prediction
    // In production, this would use a trained model
    
    let totalPathLength = 0;
    
    for (const tree of this.trees) {
      totalPathLength += tree.pathLength(features);
    }
    
    const avgPathLength = totalPathLength / this.trees.length;
    const expectedPathLength = this.expectedPathLength(this.sampleSize);
    
    // Anomaly score: closer to 1 means more anomalous
    return Math.pow(2, -avgPathLength / expectedPathLength);
  }

  private expectedPathLength(n: number): number {
    if (n <= 1) return 0;
    return 2 * (Math.log(n - 1) + 0.5772156649) - (2 * (n - 1) / n);
  }
}

class IsolationTree {
  pathLength(features: number[]): number {
    // Simplified path length calculation
    // In production, this would traverse the actual tree
    return Math.random() * 10 + 5; // Mock implementation
  }
}

/**
 * Network Graph Analysis for detecting fraud rings
 */
class NetworkGraph {
  async analyzeConnections(entityId: string, ipAddress: string): Promise<{
    risk_score: number;
    confidence: number;
    connected_entities: number;
  }> {
    try {
      // Find entities connected through shared IPs, devices, etc.
      const { data: connections } = await supabaseAdmin
        .from('api_audit_logs')
        .select('entity_id')
        .eq('ip_address', ipAddress)
        .neq('entity_id', entityId);

      const connectedEntities = connections?.length || 0;
      
      // Simple risk scoring based on network size
      let riskScore = 0;
      if (connectedEntities > 10) riskScore = 0.9;
      else if (connectedEntities > 5) riskScore = 0.7;
      else if (connectedEntities > 2) riskScore = 0.5;
      else riskScore = 0.1;

      return {
        risk_score: riskScore,
        confidence: 0.8,
        connected_entities: connectedEntities,
      };

    } catch (error) {
      console.error('Network analysis error:', error);
      return { risk_score: 0, confidence: 0, connected_entities: 0 };
    }
  }
}

// Export singleton instance
export const fraudDetectionEngine = new FraudDetectionEngine();

// Utility functions
export function formatRiskScore(score: number): string {
  return `${Math.round(score)}/100`;
}

export function getRiskColor(level: string): string {
  switch (level) {
    case 'low': return 'text-green-600';
    case 'medium': return 'text-yellow-600';
    case 'high': return 'text-orange-600';
    case 'critical': return 'text-red-600';
    default: return 'text-gray-600';
  }
}

export function getActionColor(action: string): string {
  switch (action) {
    case 'approve': return 'text-green-600';
    case 'review': return 'text-yellow-600';
    case 'reject': return 'text-orange-600';
    case 'block': return 'text-red-600';
    default: return 'text-gray-600';
  }
}