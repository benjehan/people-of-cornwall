import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=No authorization code`);
  }

  // Parse cookies from request
  const cookieHeader = request.headers.get('cookie') ?? '';
  const requestCookies: { name: string; value: string }[] = [];
  
  if (cookieHeader) {
    cookieHeader.split(';').forEach(cookie => {
      const [name, ...rest] = cookie.trim().split('=');
      if (name) {
        requestCookies.push({ name, value: rest.join('=') });
      }
    });
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return requestCookies;
        },
        setAll() {},
      },
    }
  );

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.session) {
    console.error('[Auth] Exchange error:', error?.message);
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error?.message || 'No session')}`);
  }

  // Redirect to client-side handler with tokens in URL (temporary, will be cleared)
  const params = new URLSearchParams({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
    next: next,
  });

  return NextResponse.redirect(`${origin}/auth/set-session?${params.toString()}`);
}
