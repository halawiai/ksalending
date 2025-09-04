import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { ZodError } from 'zod';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const tokenRequestSchema = z.object({
  api_key: z.string().min(32, 'Invalid API key format'),
  api_secret: z.string().min(32, 'Invalid API secret format'),
});

const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret';
const TOKEN_EXPIRY = '1h';

export async function POST(request: NextRequest) {
  const supabase = createServerClient();
  
  try {
    const body = await request.json();
    const { api_key, api_secret } = tokenRequestSchema.parse(body);

    // Validate API credentials
    const { data: partner, error } = await supabase
      .from('partners')
      .select('*')
      .eq('api_key_hash', api_key)
      .eq('is_active', true)
      .single();

    if (error || !partner) {
      return NextResponse.json(
        { 
          error: 'INVALID_CREDENTIALS', 
          message: 'Invalid API key or secret' 
        }, 
        { status: 401 }
      );
    }

    // Verify API secret
    const isValidSecret = await bcrypt.compare(api_secret, partner.api_secret_hash);
    if (!isValidSecret) {
      return NextResponse.json(
        { 
          error: 'INVALID_CREDENTIALS', 
          message: 'Invalid API key or secret' 
        }, 
        { status: 401 }
      );
    }

    // Check rate limits
    const rateLimitKey = `rate_limit:${partner.id}`;
    const currentHour = Math.floor(Date.now() / (1000 * 60 * 60));
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        partner_id: partner.id,
        partner_name: partner.partner_name,
        partner_type: partner.partner_type,
        permissions: partner.permissions || [],
        iat: Math.floor(Date.now() / 1000),
      },
      JWT_SECRET,
      { expiresIn: TOKEN_EXPIRY }
    );

    // Log authentication
    await supabase
      .from('api_audit_logs')
      .insert({
        partner_id: partner.id,
        endpoint: '/api/v1/auth/token',
        method: 'POST',
        ip_address: request.headers.get('x-forwarded-for') || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown',
        status: 'success',
        response_time: 0,
      });

    return NextResponse.json({
      access_token: token,
      token_type: 'Bearer',
      expires_in: 3600,
      partner_id: partner.id,
      partner_name: partner.partner_name,
      rate_limit: {
        requests_per_hour: partner.rate_limit || 100,
        remaining: (partner.rate_limit || 100) - (partner.current_usage || 0),
      },
    });

  } catch (error) {
    console.error('Token generation error:', error);
    
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

    return NextResponse.json(
      { 
        error: 'INTERNAL_ERROR', 
        message: 'Internal server error' 
      }, 
      { status: 500 }
    );
  }
}