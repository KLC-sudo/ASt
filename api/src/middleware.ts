import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Simple JWT check — no NextAuth middleware complexity
export function middleware(request: NextRequest) {
  const session = request.cookies.get('next-auth.session-token')?.value
    || request.cookies.get('__Secure-next-auth.session-token')?.value;

  const isLogin = request.nextUrl.pathname === '/admin/login';

  if (!session && !isLogin) {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
