import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth, signIn } from '@/server/auth';

export const metadata: Metadata = { title: 'Admin Login — Album Studies' };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; callbackUrl?: string }>;
}) {
  const session = await auth();
  if (session?.user) redirect('/admin/dashboard');
  const { error, callbackUrl } = await searchParams;

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="glass-panel w-full max-w-md rounded-2xl p-8 shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-full border border-white/10 flex items-center justify-center bg-white/5 mb-4">
            <div className="w-7 h-7 rounded-full border border-mustard/60 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-mustard" />
            </div>
          </div>
          <h1 className="text-xl font-semibold tracking-wider uppercase text-offwhite">Admin Login</h1>
          <p className="text-[10px] tracking-[0.2em] uppercase text-white/40 mt-1">Album Studies Control Deck</p>
        </div>

        <form
          action={async (formData) => {
            'use server';
            try {
              await signIn('credentials', {
                email: formData.get('email'),
                password: formData.get('password'),
                redirectTo: callbackUrl || '/admin/dashboard',
              });
            } catch (e) {
              if ((e as { digest?: string }).digest?.startsWith('NEXT_REDIRECT')) throw e;
              redirect('/admin/login?error=invalid');
            }
          }}
          className="space-y-5"
        >
          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-semibold tracking-wider text-white/50 uppercase">Email</label>
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              className="custom-input rounded-xl px-4 py-3.5 text-sm"
              placeholder="admin@albumstudies.com"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-semibold tracking-wider text-white/50 uppercase">Password</label>
            <input
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete="current-password"
              className="custom-input rounded-xl px-4 py-3.5 text-sm"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {error === 'invalid' ? 'Invalid email or password.' : error}
            </p>
          )}

          <button type="submit" className="btn-primary w-full">
            Sign in
          </button>
        </form>

        <p className="text-[10px] text-white/30 tracking-wider text-center mt-6">
          No self-signup. Admins are seeded via <code className="text-white/50">prisma db seed</code>.
        </p>
      </div>
    </main>
  );
}
