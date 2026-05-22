import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

import { isAuthDisabled } from '@/lib/env/authBypass';
import { getClientEnv } from '@/lib/env/client';

const AUTH_ROUTES = ['/login', '/signup'];

function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.includes(pathname);
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  const { supabaseUrl, supabaseAnonKey } = getClientEnv();

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        supabaseResponse = NextResponse.next({ request });

        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { supabaseResponse, user };
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith('/p/') || pathname.startsWith('/book/') || pathname.startsWith('/api/webhooks/') || pathname.startsWith('/api/book/') || pathname.startsWith('/api/portal/')) {
    return NextResponse.next({ request });
  }

  if (isAuthDisabled()) {
    if (pathname === '/' || isAuthRoute(pathname)) {
      return NextResponse.redirect(new URL('/pipeline', request.url));
    }

    return NextResponse.next({ request });
  }

  const { supabaseResponse, user } = await updateSession(request);

  if (pathname === '/' || pathname.startsWith('/api/')) {
    return supabaseResponse;
  }

  if (isAuthRoute(pathname)) {
    if (user) {
      return NextResponse.redirect(new URL('/pipeline', request.url));
    }

    return supabaseResponse;
  }

  if (!user) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
