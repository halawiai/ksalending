import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { creditScoringEngine } from '@/lib/scoring/engine';
import { z } from 'zod';
import { ZodError } from 'zod';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret';

const assessmentRequestSchema = z.object({
  entity_type: z.enum(['individual', 'company', 'institution']),
  identification: z.object({
    type: z.enum(['national_id', 'commercial_reg', 'license_number']),
    number: z.string().min(8, 'Invalid identification number'),
  }),
  loan_details: z.object({
    amount: z.number().min(1000, 'Minimum loan amount is 1,000 SAR'),
    purpose: z.string().min(2, 'Loan purpose is required'),
    tenure_months: z.number().min(6).max(120, 'Tenure must be between 6-120 months'),
  }).optional(),
  include_alternative_data: z.boolean().default(true),
  include_fraud_check: z.boolean().default(true),
});

// Rate limiting middleware
async function checkRateLimit(partnerId: string, supabase: any): Promise<boolean> {
  const currentHour = Math.floor(Date.now() / (1000 * 60 * 60));
  const rateLimitKey = `${partnerId}:${currentHour}`;

  const { data: partner } = await supabase
    .from('partners')
    .select('rate_limit, current_usage')
    .eq('id', partnerId)
    .single();

  if (!partner) return false;

  const rateLimit = partner.rate_limit || 100;
  const currentUsage = partner.current_usage || 0;

  return currentUsage < rateLimit;
}

async function incrementUsage(partnerId: string, supabase: any) {
  await supabase.rpc('increment_partner_usage', { partner_id: partnerId });
}

export async function POST(request: NextRequest) {
  const supabase = createServerClient();
  const startTime = performance.now();
  
  try {
    // Authenticate partner
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'MISSING_TOKEN', message: 'Authorization token required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    if (!decoded || !decoded.partner_id) {
      return NextResponse.json(
        { error: 'INVALID_TOKEN', message: 'Invalid token' },
        { status: 401 }
      );
    }

    // Check rate limits
    const canProceed = await checkRateLimit(decoded.partner_id, supabase);
    if (!canProceed) {
      return NextResponse.json(
        { error: 'RATE_LIMIT_EXCEEDED', message: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    // Validate request
    const body = await request.json();
    const validatedData = assessmentRequestSchema.parse(body);

    // Find or create entity
    let entity = null;
    const { data: existingEntity } = await supabase
      .from('entities')
      .select(`
        *,
        individual_profiles(*),
        company_profiles(*),
        institution_profiles(*)
      `)
      .eq('entity_type', validatedData.entity_type)
      .single();

    if (existingEntity) {
      entity = existingEntity;
    } else {
      // Create new entity (simplified for API)
      const { data: newEntity, error: createError } = await supabase
        .from('entities')
        .insert({
          entity_type: validatedData.entity_type,
          verification_status: 'pending',
          created_by: decoded.partner_id,
        })
        .select()
        .single();

      if (createError) {
        throw new Error('Failed to create entity');
      }

      entity = newEntity;
    }

    // Calculate credit score
    const scoringResult = await creditScoringEngine.calculateCreditScore(
      entity,
      undefined, // Credit bureau data would be fetched here
      validatedData.include_alternative_data ? [] : undefined
    );

    // Fraud check if requested
    let fraudCheck = null;
    if (validatedData.include_fraud_check) {
      fraudCheck = await creditScoringEngine.detectFraud(entity, scoringResult);
    }

    // Determine loan decision
    const loanAmount = validatedData.loan_details?.amount || 0;
    const maxApprovedAmount = Math.min(
      loanAmount,
      scoringResult.loanAmountRange.max
    );

    let decision = 'declined';
    let approvedAmount = 0;

    if (scoringResult.score >= 650 && (!fraudCheck || fraudCheck.recommendation !== 'reject')) {
      decision = 'approved';
      approvedAmount = maxApprovedAmount;
    } else if (scoringResult.score >= 550 && (!fraudCheck || fraudCheck.recommendation === 'review')) {
      decision = 'conditional';
      approvedAmount = Math.floor(maxApprovedAmount * 0.7);
    }

    // Create assessment record
    const assessmentId = `assess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const { error: insertError } = await supabase
      .from('assessments')
      .insert({
        id: assessmentId,
        entity_id: entity.id,
        entity_type: entity.entity_type,
        assessment_type: 'loan_application',
        score: scoringResult.score,
        risk_level: scoringResult.riskLevel.toLowerCase(),
        factors: scoringResult.factors,
        recommendations: scoringResult.recommendations,
        created_by: decoded.partner_id,
      });

    if (insertError) {
      console.error('Failed to save assessment:', insertError);
    }

    // Increment partner usage
    await incrementUsage(decoded.partner_id, supabase);

    const processingTime = Math.round(performance.now() - startTime);

    // Log API call
    await supabase
      .from('api_audit_logs')
      .insert({
        partner_id: decoded.partner_id,
        endpoint: '/api/v1/assessments',
        method: 'POST',
        entity_id: entity.id,
        ip_address: request.headers.get('x-forwarded-for') || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown',
        status: 'success',
        response_time: processingTime,
        request_data: validatedData,
      });

    // Prepare response
    const response = {
      assessment_id: assessmentId,
      entity_id: entity.id,
      credit_score: scoringResult.score,
      risk_category: scoringResult.riskLevel.toLowerCase().replace('_', ' '),
      decision,
      approved_amount: approvedAmount,
      max_amount: scoringResult.loanAmountRange.max,
      interest_rate: scoringResult.suggestedInterestRate.min,
      interest_rate_range: scoringResult.suggestedInterestRate,
      probability_of_default: Math.round(scoringResult.probabilityOfDefault * 100) / 100,
      processing_time_ms: processingTime,
      factors: scoringResult.factors.map(factor => ({
        category: factor.category,
        impact: factor.impact,
        weight: factor.weight,
        description: factor.description,
      })),
      recommendations: scoringResult.recommendations,
      fraud_check: fraudCheck ? {
        risk_score: fraudCheck.riskScore,
        flags: fraudCheck.flags,
        recommendation: fraudCheck.recommendation,
      } : null,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString(),
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Assessment API error:', error);
    
    const processingTime = Math.round(performance.now() - startTime);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'VALIDATION_ERROR', 
          message: 'Invalid request format',
          details: (error as ZodError).issues,
          processing_time_ms: processingTime,
        }, 
        { status: 400 }
      );
    }

    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json(
        { error: 'INVALID_TOKEN', message: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { 
        error: 'INTERNAL_ERROR', 
        message: 'Internal server error',
        processing_time_ms: processingTime,
      }, 
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const supabase = createServerClient();
  const { searchParams } = new URL(request.url);
  
  try {
    // Authenticate partner
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'MISSING_TOKEN', message: 'Authorization token required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    // Parse query parameters
    const entityId = searchParams.get('entity_id');
    const entityType = searchParams.get('entity_type');
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query
    let query = supabase
      .from('assessments')
      .select('*')
      .eq('created_by', decoded.partner_id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (entityId) {
      query = query.eq('entity_id', entityId);
    }

    if (entityType) {
      query = query.eq('entity_type', entityType);
    }

    const { data: assessments, error } = await query;

    if (error) {
      throw error;
    }

    // Log API call
    await supabase
      .from('api_audit_logs')
      .insert({
        partner_id: decoded.partner_id,
        endpoint: '/api/v1/assessments',
        method: 'GET',
        ip_address: request.headers.get('x-forwarded-for') || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown',
        status: 'success',
        response_time: 0,
      });

    return NextResponse.json({
      assessments: assessments || [],
      pagination: {
        limit,
        offset,
        total: assessments?.length || 0,
      },
    });

  } catch (error) {
    console.error('Get assessments error:', error);
    
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json(
        { error: 'INVALID_TOKEN', message: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Internal server error' },
      { status: 500 }
    );
  }
}