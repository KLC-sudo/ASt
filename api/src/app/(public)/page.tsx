import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex-1 flex items-center justify-center px-6 py-20">
      <div className="max-w-2xl text-center space-y-8">
        <p className="text-xs tracking-[0.35em] uppercase text-mustard/80">Quaestor Favillae — Tickets</p>
        <h1 className="font-aicon text-4xl md:text-6xl text-offwhite" style={{ letterSpacing: '-0.075em' }}>
          Where the music goes deeper
        </h1>
        <p className="text-white/55 text-base md:text-lg leading-relaxed">
          Browse upcoming events. Pay with mobile money, get your e-ticket by email.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
          <Link href="/events" className="btn-primary">
            Get Tickets
          </Link>
          <Link
            href="/admin/login"
            className="px-6 py-3 rounded-xl border border-white/10 bg-white/5 text-white/70 hover:text-offwhite text-sm uppercase tracking-wider"
          >
            Admin
          </Link>
        </div>
      </div>
    </main>
  );
}
