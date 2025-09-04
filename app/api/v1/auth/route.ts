import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = createServerClient();
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}