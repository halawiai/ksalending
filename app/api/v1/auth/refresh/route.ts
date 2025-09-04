import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret';
const TOKEN_EXPIRY = '1h';

export async function POST(request: NextRequest) {
  const supabase = createServerClient();
  
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'MISSING_TOKEN', message: 'Authorization token required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    
    // Verify existing token (even if expired)
    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        // Allow refresh of expired tokens
        decoded = jwt.decode(token);
      } else {
        return NextResponse.json(
          { error: 'INVALID_TOKEN', message: 'Invalid token' },
          { status: 401 }
        );
      }
    }

    if (!decoded || !decoded.partner_id) {
      return NextResponse.json(
        { error: 'INVALID_TOKEN', message: 'Invalid token format' },
        { status: 401 }
      );
    }

    // Verify partner is still active
    const { data: partner, error } = await supabase
      .from('partners')
      .select('*')
      .eq('id', decoded.partner_id)
      .eq('is_active', true)
      .single();

    if (error || !partner) {
      return NextResponse.json(
        { error: 'PARTNER_INACTIVE', message: 'Partner account is inactive' },
        { status: 401 }
      );
    }

    // Generate new token
    const newToken = jwt.sign(
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

    // Log token refresh
    await supabase
      .from('api_audit_logs')
      .insert({
        partner_id: partner.id,
        endpoint: '/api/v1/auth/refresh',
        method: 'POST',
        ip_address: request.headers.get('x-forwarded-for') || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown',
        status: 'success',
        response_time: 0,
      });

    return NextResponse.json({
      access_token: newToken,
      token_type: 'Bearer',
      expires_in: 3600,
      partner_id: partner.id,
      partner_name: partner.partner_name,
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Internal server error' },
      { status: 500 }
    );
  }
}