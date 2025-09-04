import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { ZodError } from 'zod';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret';

const updateEntitySchema = z.object({
  profile_data: z.object({
    // Individual fields
    first_name: z.string().optional(),
    last_name: z.string().optional(),
    date_of_birth: z.string().optional(),
    nationality: z.string().optional(),
    phone_number: z.string().optional(),
    email: z.string().email().optional(),
    monthly_income: z.number().optional(),
    employment_status: z.enum(['employed', 'self_employed', 'unemployed', 'retired']).optional(),
    
    // Company fields
    company_name: z.string().optional(),
    legal_form: z.enum(['llc', 'joint_stock', 'partnership', 'sole_proprietorship']).optional(),
    establishment_date: z.string().optional(),
    industry_sector: z.string().optional(),
    annual_revenue: z.number().optional(),
    employee_count: z.number().optional(),
    
    // Institution fields
    institution_name: z.string().optional(),
    institution_type: z.enum(['bank', 'finance_company', 'microfinance', 'cooperative']).optional(),
    regulatory_authority: z.enum(['sama', 'cma', 'other']).optional(),
    capital_adequacy_ratio: z.number().optional(),
  }).optional(),
  verification_status: z.enum(['pending', 'verified', 'rejected']).optional(),
});

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

    // Get entity
    const { data: entity, error } = await supabase
      .from('entities')
      .select(`
        *,
        identifications(*),
        individual_profiles(*),
        company_profiles(*),
        institution_profiles(*)
      `)
      .eq('id', params.id)
      .eq('created_by', decoded.partner_id)
      .single();

    if (error || !entity) {
      return NextResponse.json(
        { error: 'ENTITY_NOT_FOUND', message: 'Entity not found' },
        { status: 404 }
      );
    }

    // Log API call
    await supabase
      .from('api_audit_logs')
      .insert({
        partner_id: decoded.partner_id,
        endpoint: `/api/v1/entities/${params.id}`,
        method: 'GET',
        entity_id: entity.id,
        ip_address: request.headers.get('x-forwarded-for') || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown',
        status: 'success',
        response_time: 0,
      });

    // Format response
    const response = {
      entity_id: entity.id,
      entity_type: entity.entity_type,
      verification_status: entity.verification_status,
      identification: entity.identifications?.[0] ? {
        type: entity.identifications[0].identification_type,
        number: entity.identifications[0].identification_value,
        verified: entity.identifications[0].nafath_verified,
        verification_date: entity.identifications[0].nafath_verification_date,
      } : null,
      profile: entity.individual_profiles?.[0] || entity.company_profiles?.[0] || entity.institution_profiles?.[0] || null,
      created_at: entity.created_at,
      updated_at: entity.updated_at,
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Get entity error:', error);
    
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

export async function PUT(
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

    // Validate request
    const body = await request.json();
    const validatedData = updateEntitySchema.parse(body);

    // Get existing entity
    const { data: entity, error: entityError } = await supabase
      .from('entities')
      .select('*')
      .eq('id', params.id)
      .eq('created_by', decoded.partner_id)
      .single();

    if (entityError || !entity) {
      return NextResponse.json(
        { error: 'ENTITY_NOT_FOUND', message: 'Entity not found' },
        { status: 404 }
      );
    }

    // Update entity if verification status changed
    if (validatedData.verification_status) {
      await supabase
        .from('entities')
        .update({
          verification_status: validatedData.verification_status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', params.id);
    }

    // Update profile based on entity type
    if (validatedData.profile_data) {
      let updateError = null;
      
      if (entity.entity_type === 'individual') {
        const { error } = await supabase
          .from('individual_profiles')
          .update({
            ...validatedData.profile_data,
            updated_at: new Date().toISOString(),
          })
          .eq('entity_id', params.id);
        updateError = error;
      } else if (entity.entity_type === 'company') {
        const { error } = await supabase
          .from('company_profiles')
          .update({
            ...validatedData.profile_data,
            updated_at: new Date().toISOString(),
          })
          .eq('entity_id', params.id);
        updateError = error;
      } else if (entity.entity_type === 'institution') {
        const { error } = await supabase
          .from('institution_profiles')
          .update({
            ...validatedData.profile_data,
            updated_at: new Date().toISOString(),
          })
          .eq('entity_id', params.id);
        updateError = error;
      }

      if (updateError) {
        console.error('Profile update error:', updateError);
        return NextResponse.json(
          { error: 'UPDATE_FAILED', message: 'Failed to update profile' },
          { status: 500 }
        );
      }
    }

    // Log API call
    await supabase
      .from('api_audit_logs')
      .insert({
        partner_id: decoded.partner_id,
        endpoint: `/api/v1/entities/${params.id}`,
        method: 'PUT',
        entity_id: params.id,
        ip_address: request.headers.get('x-forwarded-for') || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown',
        status: 'success',
        response_time: 0,
        request_data: validatedData,
      });

    return NextResponse.json({
      entity_id: params.id,
      message: 'Entity updated successfully',
      updated_at: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Update entity error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'VALIDATION_ERROR', 
          message: 'Invalid request format',
          details: (error as ZodError).issues
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
      { error: 'INTERNAL_ERROR', message: 'Internal server error' },
      { status: 500 }
    );
  }
}