import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { creditScoringEngine } from '@/lib/scoring/engine';
import { dataAggregationService } from '@/lib/scoring/api';
import { 
  ScoringAPIRequest, 
  ScoringAPIResponse, 
  FraudCheckResult,
  AuditEntry,
  FraudFlag,
  LoanDecision
} from '@/lib/scoring/types';

// Helper function to transform fraud check data to match FraudCheckResult type
const toFraudCheckResult = (raw?: {
  riskScore: number;
  flags: string[];
  recommendation: 'approve' | 'review' | 'reject';
  riskLevel: 'low' | 'medium' | 'high';
  confidence: number;
  detectionMethods: string[];
}): FraudCheckResult | undefined => {
  if (!raw) return undefined;
  return {
    riskScore: raw.riskScore,
    // Cast string[] -> FraudFlag[]
    flags: raw.flags as FraudFlag[],
    recommendation: raw.recommendation,
    riskLevel: raw.riskLevel,
    confidence: raw.confidence,
    detectionMethods: raw.detectionMethods,
  };
};

export async function POST(request: NextRequest) {
  const supabase = createServerClient();
  
  try {
    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { 
          success: false, 
          error: { code: 'UNAUTHORIZED', message: 'Authentication required' } 
        }, 
        { status: 401 }
      );
    }

    const requestBody: ScoringAPIRequest = await request.json();
    const { entityId, assessmentType, configuration, options } = requestBody;

    // Validate request
    if (!entityId || !assessmentType) {
      return NextResponse.json(
        { 
          success: false, 
          error: { code: 'INVALID_REQUEST', message: 'entityId and assessmentType are required' } 
        }, 
        { status: 400 }
      );
    }

    // Get entity data
    const { data: entity, error: entityError } = await supabase
      .from('entities')
      .select(`
        *,
        individual_profiles(*),
        company_profiles(*),
        institution_profiles(*)
      `)
      .eq('id', entityId)
      .single();

    if (entityError || !entity) {
      return NextResponse.json(
        { 
          success: false, 
          error: { code: 'ENTITY_NOT_FOUND', message: 'Entity not found' } 
        }, 
        { status: 404 }
      );
    }

    // Check permissions
    const hasPermission = await checkScoringPermissions(user.id, entity.id, supabase);
    if (!hasPermission) {
      return NextResponse.json(
        { 
          success: false, 
          error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } 
        }, 
        { status: 403 }
      );
    }

    const startTime = performance.now();
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Aggregate external data if requested
    let creditBureauData = null;
    let alternativeData = null;

    if (options?.includeAlternativeData) {
      try {
        if (entity.entity_type === 'individual') {
          const profile = entity.individual_profiles[0];
          const aggregatedData = await dataAggregationService.aggregateIndividualData(
            profile.national_id,
            profile.phone_number
          );
          creditBureauData = aggregatedData.creditBureau;
          alternativeData = aggregatedData.alternative?.dataPoints;
        } else if (entity.entity_type === 'company') {
          const profile = entity.company_profiles[0];
          const aggregatedData = await dataAggregationService.aggregateCompanyData(
            profile.commercial_registration
          );
          creditBureauData = aggregatedData.creditBureau;
        }
      } catch (error) {
        console.warn('External data aggregation failed:', error);
        // Continue with scoring using available data
      }
    }

    // Calculate credit score
    const scoringResult = await creditScoringEngine.calculateCreditScore(
      entity,
      (creditBureauData ?? undefined) as any,
      (alternativeData ? alternativeData : undefined)
    );

    // Fraud check if requested
    let fraudCheck = null;
    if (options?.includeFraudCheck) {
      const fraudCheckRaw = await creditScoringEngine.detectFraud(entity, scoringResult);
      fraudCheck = fraudCheckRaw ? {
        riskScore: fraudCheckRaw.riskScore,
        flags: fraudCheckRaw.flags,
        recommendation: fraudCheckRaw.recommendation,
        riskLevel: fraudCheckRaw.riskScore >= 0.75 ? 'high' as const :
                   fraudCheckRaw.riskScore >= 0.40 ? 'medium' as const : 'low' as const,
        confidence: 0.7, // default confidence
        detectionMethods: ['heuristics'], // default detection methods
      } : null;
    }

    // Create assessment record
    const assessmentId = `assess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const { error: insertError } = await supabase
      .from('assessments')
      .insert({
        id: assessmentId,
        entity_id: entityId,
        entity_type: entity.entity_type,
        assessment_type: assessmentType,
        score: scoringResult.score,
        risk_level: scoringResult.riskLevel.toLowerCase(),
        factors: scoringResult.factors,
        recommendations: scoringResult.recommendations,
        created_by: user.id,
      });

    if (insertError) {
      console.error('Failed to save assessment:', insertError);
      // Continue with response even if saving fails
    }

    const processingTime = performance.now() - startTime;

    const response: ScoringAPIResponse = {
      success: true,
      data: {
        entityId,
        assessmentId,
        score: scoringResult.score,
        riskLevel: scoringResult.riskLevel,
        probabilityOfDefault: scoringResult.probabilityOfDefault,
        confidence: scoringResult.confidence,
        processingTime,
        factors: scoringResult.factors.map(factor => ({
          category: factor.category,
          subcategory: factor.category,
          weight: factor.weight,
          score: factor.score,
          impact: factor.impact,
          description: factor.description,
          dataSource: 'credit_bureau',
          confidence: scoringResult.confidence,
          lastUpdated: new Date().toISOString(),
        })),
        recommendations: scoringResult.recommendations.map(rec => ({
          type: 'improvement',
          priority: 'medium',
          category: 'general',
          title: rec,
          description: rec,
          actionItems: [rec],
          estimatedImpact: 10,
          timeframe: '3-6 months',
        })),
        loanDecision: {
          decision: scoringResult.score >= 650 ? 'approved' : scoringResult.score >= 550 ? 'conditional' : 'declined',
          approvedAmount: scoringResult.loanAmountRange.max,
          maxAmount: scoringResult.loanAmountRange.max,
          interestRateRange: { min: 5.0, max: 15.0 },
          termOptions: [12, 24, 36, 48, 60],
          conditions: scoringResult.score < 650 ? ['Additional documentation required', 'Co-signer may be needed'] : [],
          validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          fraudCheck: fraudCheck
            ? ({
                ...fraudCheck,
                flags: (fraudCheck.flags as unknown as FraudFlag[]),
              } as FraudCheckResult)
            : undefined,
        },
        fraudCheck: fraudCheck
          ? ({
              ...fraudCheck,
              flags: (fraudCheck.flags as unknown as FraudFlag[]),
            } as FraudCheckResult)
          : undefined,
        auditTrail: scoringResult.auditTrail.map(a => ({
          ...a,
          entityId: (a as any).entityId ?? entityId,
        })) as AuditEntry[],
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      },
      metadata: {
        requestId,
        processingTime,
        apiVersion: '1.0',
        timestamp: new Date().toISOString(),
      },
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Scoring API error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          code: 'INTERNAL_ERROR', 
          message: 'Internal server error',
          details: error instanceof Error ? error.message : 'Unknown error'
        } 
      }, 
      { status: 500 }
    );
  }
}

async function checkScoringPermissions(userId: string, entityId: string, supabase: any): Promise<boolean> {
  try {
    // Check if user has admin role
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('role, entity_id')
      .eq('id', userId)
      .single();

    if (!userProfile) return false;

    // Admin can score any entity
    if (userProfile.role === 'admin') return true;

    // Analysts can score entities
    if (userProfile.role === 'analyst') return true;

    // Users can only score their own entity
    if (userProfile.entity_id === entityId) return true;

    return false;
  } catch (error) {
    console.error('Permission check error:', error);
    return false;
  }
}

export async function GET(request: NextRequest) {
  const supabase = createServerClient();
  const { searchParams } = new URL(request.url);
  const entityId = searchParams.get('entityId');

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, 
        { status: 401 }
      );
    }

    if (!entityId) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_REQUEST', message: 'entityId is required' } }, 
        { status: 400 }
      );
    }

    // Get latest assessment
    const { data: assessment, error } = await supabase
      .from('assessments')
      .select('*')
      .eq('entity_id', entityId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !assessment) {
      return NextResponse.json(
        { success: false, error: { code: 'ASSESSMENT_NOT_FOUND', message: 'No assessment found' } }, 
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: assessment,
      metadata: {
        requestId: `get_${Date.now()}`,
        processingTime: 0,
        apiVersion: '1.0',
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('Get assessment error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } }, 
      { status: 500 }
    );
  }
}