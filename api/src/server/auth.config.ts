// Minimal auth.config for the route handler (NextAuth v5 requires splitting for edge-safe usage)
import type { NextAuthConfig } from 'next-auth';

export const authConfig: NextAuthConfig = {
  trustHost: true,
  session: { strategy: 'jwt' },
  pages: { signIn: '/admin/login' },
  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isAdminRoute = nextUrl.pathname.startsWith('/admin') && !nextUrl.pathname.startsWith('/admin/login');
      if (isAdminRoute) return isLoggedIn;
      return true;
    },
  },
};
