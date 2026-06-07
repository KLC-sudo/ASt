import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth, signOut } from '@/server/auth';

const NAV = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: '◐' },
  { href: '/admin/events', label: 'Events', icon: '◆' },
  { href: '/admin/orders', label: 'Orders', icon: '◈' },
  { href: '/admin/webhooks', label: 'Webhooks', icon: '⌁' },
  { href: '/admin/manual-verify', label: 'Manual Verify', icon: '✎' },
  { href: '/admin/help', label: 'Android Setup', icon: 'ⓘ' },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect('/admin/login');

  return (
    <div className="min-h-screen flex flex-col p-4 md:p-8">
      <header className="glass-panel w-full max-w-7xl mx-auto rounded-2xl px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4 mb-6 shadow-lg">
        <div className="flex items-center gap-4">
          <Link href="/admin/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center bg-white/5">
              <div className="w-5 h-5 rounded-full border border-mustard/60 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-mustard" />
              </div>
            </div>
            <div>
              <h1 className="text-base font-semibold tracking-wider text-offwhite uppercase">Quaestor Favillae</h1>
              <p className="text-[10px] tracking-[0.2em] uppercase text-white/40">Admin Control Deck</p>
            </div>
          </Link>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <span className="text-white/50">{session.user.email}</span>
          <form
            action={async () => {
              'use server';
              await signOut({ redirectTo: '/admin/login' });
            }}
          >
            <button type="submit" className="btn-ghost text-xs">
              Sign out
            </button>
          </form>
        </div>
      </header>

      <main className="w-full max-w-7xl mx-auto flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
        <aside className="lg:col-span-1 flex flex-col gap-3">
          <div className="glass-panel p-3 rounded-2xl flex flex-col gap-1 shadow-md">
            <div className="text-[10px] tracking-[0.25em] uppercase text-white/30 px-3 pb-3 border-b border-white/5 mb-2 font-semibold">
              Sections
            </div>
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-left px-4 py-2.5 rounded-xl border border-transparent text-sm font-medium text-white/60 hover:text-offwhite hover:bg-white/5 flex items-center gap-3"
              >
                <span className="text-base text-bluepurple/70">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </div>
          <div className="mt-auto" />
        </aside>
        <section className="lg:col-span-3 glass-panel rounded-2xl p-6 md:p-8 shadow-md min-h-[500px]">
          {children}
        </section>
      </main>
    </div>
  );
}
