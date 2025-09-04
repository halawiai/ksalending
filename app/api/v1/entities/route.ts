import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { ZodError } from 'zod';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret';

const createEntitySchema = z.object({
  entity_type: z.enum(['individual', 'company', 'institution']),
  identification: z.object({
    type: z.enum(['national_id', 'commercial_reg', 'license_number']),
    number: z.string().min(8, 'Invalid identification number'),
  }),
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
  }),
});

export async function POST(request: NextRequest) {
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
    const validatedData = createEntitySchema.parse(body);

    // Check if entity already exists
    const { data: existingEntity } = await supabase
      .from('identifications')
      .select('entity_id')
      .eq('identification_type', validatedData.identification.type)
      .eq('identification_value', validatedData.identification.number)
      .single();

    if (existingEntity) {
      return NextResponse.json(
        { error: 'ENTITY_EXISTS', message: 'Entity with this identification already exists' },
        { status: 409 }
      );
    }

    // Create entity
    const { data: entity, error: entityError } = await supabase
      .from('entities')
      .insert({
        entity_type: validatedData.entity_type,
        verification_status: 'pending',
        created_by: decoded.partner_id,
      })
      .select()
      .single();

    if (entityError) {
      throw new Error('Failed to create entity');
    }

    // Create identification record
    await supabase
      .from('identifications')
      .insert({
        entity_id: entity.id,
        identification_type: validatedData.identification.type,
        identification_value: validatedData.identification.number,
        nafath_verified: false,
      });

    // Create profile based on entity type
    let profileError = null;
    
    if (validatedData.entity_type === 'individual') {
      const { error } = await supabase
        .from('individual_profiles')
        .insert({
          entity_id: entity.id,
          first_name: validatedData.profile_data.first_name || '',
          last_name: validatedData.profile_data.last_name || '',
          date_of_birth: validatedData.profile_data.date_of_birth || '',
          nationality: validatedData.profile_data.nationality || '',
          phone_number: validatedData.profile_data.phone_number || '',
          email: validatedData.profile_data.email || '',
          monthly_income: validatedData.profile_data.monthly_income,
          employment_status: validatedData.profile_data.employment_status || 'employed',
        });
      profileError = error;
    } else if (validatedData.entity_type === 'company') {
      const { error } = await supabase
        .from('company_profiles')
        .insert({
          entity_id: entity.id,
          company_name: validatedData.profile_data.company_name || '',
          legal_form: validatedData.profile_data.legal_form || 'llc',
          establishment_date: validatedData.profile_data.establishment_date || '',
          industry_sector: validatedData.profile_data.industry_sector || '',
          annual_revenue: validatedData.profile_data.annual_revenue,
          employee_count: validatedData.profile_data.employee_count,
        });
      profileError = error;
    } else if (validatedData.entity_type === 'institution') {
      const { error } = await supabase
        .from('institution_profiles')
        .insert({
          entity_id: entity.id,
          institution_name: validatedData.profile_data.institution_name || '',
          institution_type: validatedData.profile_data.institution_type || 'bank',
          regulatory_authority: validatedData.profile_data.regulatory_authority || 'sama',
          capital_adequacy_ratio: validatedData.profile_data.capital_adequacy_ratio,
        });
      profileError = error;
    }

    if (profileError) {
      console.error('Profile creation error:', profileError);
      // Continue anyway, profile can be updated later
    }

    // Log API call
    await supabase
      .from('api_audit_logs')
      .insert({
        partner_id: decoded.partner_id,
        endpoint: '/api/v1/entities',
        method: 'POST',
        entity_id: entity.id,
        ip_address: request.headers.get('x-forwarded-for') || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown',
        status: 'success',
        response_time: 0,
        request_data: validatedData,
      });

    return NextResponse.json({
      entity_id: entity.id,
      entity_type: entity.entity_type,
      verification_status: entity.verification_status,
      identification: {
        type: validatedData.identification.type,
        number: validatedData.identification.number,
        verified: false,
      },
      created_at: entity.created_at,
      created_by: decoded.partner_id,
    }, { status: 201 });

  } catch (error) {
    console.error('Create entity error:', error);
    
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
    const entityType = searchParams.get('entity_type');
    const identificationType = searchParams.get('identification_type');
    const identificationNumber = searchParams.get('identification_number');
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query
    let query = supabase
      .from('entities')
      .select(`
        *,
        identifications(*),
        individual_profiles(*),
        company_profiles(*),
        institution_profiles(*)
      `)
      .eq('created_by', decoded.partner_id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (entityType) {
      query = query.eq('entity_type', entityType);
    }

    const { data: entities, error } = await query;

    if (error) {
      throw error;
    }

    // Filter by identification if specified
    let filteredEntities = entities || [];
    if (identificationType && identificationNumber) {
      filteredEntities = filteredEntities.filter(entity => 
        entity.identifications?.some((id: any) => 
          id.identification_type === identificationType && 
          id.identification_value === identificationNumber
        )
      );
    }

    // Log API call
    await supabase
      .from('api_audit_logs')
      .insert({
        partner_id: decoded.partner_id,
        endpoint: '/api/v1/entities',
        method: 'GET',
        ip_address: request.headers.get('x-forwarded-for') || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown',
        status: 'success',
        response_time: 0,
      });

    // Format response
    const formattedEntities = filteredEntities.map(entity => ({
      entity_id: entity.id,
      entity_type: entity.entity_type,
      verification_status: entity.verification_status,
      identification: entity.identifications?.[0] ? {
        type: entity.identifications[0].identification_type,
        number: entity.identifications[0].identification_value,
        verified: entity.identifications[0].nafath_verified,
      } : null,
      profile: entity.individual_profiles?.[0] || entity.company_profiles?.[0] || entity.institution_profiles?.[0] || null,
      created_at: entity.created_at,
      updated_at: entity.updated_at,
    }));

    return NextResponse.json({
      entities: formattedEntities,
      pagination: {
        limit,
        offset,
        total: formattedEntities.length,
      },
    });

  } catch (error) {
    console.error('Get entities error:', error);
    
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