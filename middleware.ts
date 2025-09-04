import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { Database } from '@/lib/supabase/database';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  console.log('[MIDDLEWARE] Processing request:', req.nextUrl.pathname);

  // Guard: don't throw in dev if envs are missing
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  console.log('[MIDDLEWARE] Environment check - URL exists:', !!url, 'Key exists:', !!key);
  
  if (!url || !key) {
    console.warn('[supabase] missing NEXT_PUBLIC_SUPABASE_URL/ANON_KEY in middleware');
    return res;
  }

  const supabase = createMiddlewareClient<Database>(
    { req, res },
    { supabaseUrl: url, supabaseKey: key }
  );

  // Refresh session if expired - required for Server Components
  const {
    data: { session },
  } = await supabase.auth.getSession();

  console.log('[MIDDLEWARE] Session check - User exists:', !!session?.user, 'User ID:', session?.user?.id);

  // Protected routes that require authentication
  const protectedRoutes = [
    '/individual',
    '/company', 
    '/institution',
    '/onboarding',
    '/api/v1/entities',
    '/api/v1/assessments'
  ];

  // Admin routes that require specific permissions
  const adminRoutes = [
    '/admin',
    '/api/v1/admin'
  ];

  const isProtectedRoute = protectedRoutes.some(route => 
    req.nextUrl.pathname.startsWith(route)
  );

  const isAdminRoute = adminRoutes.some(route => 
    req.nextUrl.pathname.startsWith(route)
  );

  // Redirect to login if accessing protected route without session
  if (isProtectedRoute && !session) {
    const redirectUrl = new URL('/login', req.url);
    redirectUrl.searchParams.set('redirectTo', req.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Check admin permissions for admin routes
  if (isAdminRoute && session) {
    // You can add role-based checks here
    // For now, we'll allow any authenticated user
    // In production, check user roles/permissions from database
  }

  // Redirect authenticated users away from auth pages
  if (session && (req.nextUrl.pathname === '/login' || req.nextUrl.pathname === '/register')) {
    console.log('[MIDDLEWARE] Authenticated user on auth page, fetching profile...');
    
    try {
      // Fetch user profile to determine appropriate redirect
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('role, entity_type')
        .eq('id', session.user.id)
        .single();

      console.log('[MIDDLEWARE] User profile fetched:', userProfile);

      let redirectPath = '/individual'; // Default fallback

      if (userProfile) {
        // Determine redirect based on role and entity type
        if (userProfile.role === 'admin' || userProfile.role === 'analyst') {
          redirectPath = '/portal'; // Partner portal for admin/analyst roles
        } else if (userProfile.entity_type) {
          redirectPath = `/${userProfile.entity_type}`; // Entity-specific dashboard
        }
      }

      console.log('[MIDDLEWARE] Calculated redirect path:', redirectPath);
      console.log('[MIDDLEWARE] Performing redirect to:', redirectPath);
      
      return NextResponse.redirect(new URL(redirectPath, req.url));
    } catch (error) {
      console.warn('[middleware] Failed to fetch user profile, using default redirect:', error);
      console.log('[MIDDLEWARE] Error redirect to /individual');
      return NextResponse.redirect(new URL('/individual', req.url));
    }
  }

  return res;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};