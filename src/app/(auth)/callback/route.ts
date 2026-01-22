import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function GET(request: Request) {
  console.log('[CALLBACK] ====== START ======');
  
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  console.log('[CALLBACK] Code present:', !!code);
  console.log('[CALLBACK] Next path:', next);

  if (!code) {
    console.log('[CALLBACK] ERROR: No code');
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

  console.log('[CALLBACK] Cookies count:', requestCookies.length);

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

  console.log('[CALLBACK] Exchanging code for session...');
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.session) {
    console.log('[CALLBACK] ERROR:', error?.message);
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error?.message || 'No session')}`);
  }

  console.log('[CALLBACK] SUCCESS! User:', data.session.user.email);
  console.log('[CALLBACK] Access token length:', data.session.access_token.length);

  // Redirect to client-side handler with tokens in URL
  const params = new URLSearchParams({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
    next: next,
  });

  const redirectUrl = `${origin}/auth/set-session?${params.toString()}`;
  console.log('[CALLBACK] Redirecting to set-session');
  console.log('[CALLBACK] ====== END ======');

  return NextResponse.redirect(redirectUrl);
}
