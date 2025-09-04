import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createServerClient();
  
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

    // Get assessment
    const { data: assessment, error } = await supabase
      .from('assessments')
      .select(`
        *,
        entities (
          id,
          entity_type,
          verification_status,
          created_at
        )
      `)
      .eq('id', params.id)
      .eq('created_by', decoded.partner_id)
      .single();

    if (error || !assessment) {
      return NextResponse.json(
        { error: 'ASSESSMENT_NOT_FOUND', message: 'Assessment not found' },
        { status: 404 }
      );
    }

    // Log API call
    await supabase
      .from('api_audit_logs')
      .insert({
        partner_id: decoded.partner_id,
        endpoint: `/api/v1/assessments/${params.id}`,
        method: 'GET',
        entity_id: assessment.entity_id,
        ip_address: request.headers.get('x-forwarded-for') || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown',
        status: 'success',
        response_time: 0,
      });

    // Format response
    const response = {
      assessment_id: assessment.id,
      entity_id: assessment.entity_id,
      entity_type: assessment.entity_type,
      credit_score: assessment.score,
      risk_level: assessment.risk_level,
      assessment_type: assessment.assessment_type,
      factors: assessment.factors || [],
      recommendations: assessment.recommendations || [],
      created_at: assessment.created_at,
      entity: assessment.entities ? {
        id: assessment.entities.id,
        type: assessment.entities.entity_type,
        verification_status: assessment.entities.verification_status,
        created_at: assessment.entities.created_at,
      } : null,
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Get assessment error:', error);
    
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