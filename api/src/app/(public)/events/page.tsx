import { prisma } from '@/lib/prisma';
import { formatDate, formatUGX } from '@/lib/format';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function EventsPage() {
  const events = await prisma.event.findMany({
    where: { status: 'PUBLISHED' },
    orderBy: { startsAt: 'asc' },
    include: { tiers: { orderBy: { sortOrder: 'asc' } } },
  });

  return (
    <main className="max-w-6xl mx-auto px-6 py-16 md:py-24">
      <div className="mb-12">
        <p className="text-[11px] tracking-[0.3em] uppercase text-mustard/80 font-medium">Live & Upcoming</p>
        <h1
          className="font-aicon text-5xl md:text-7xl text-offwhite mt-3"
          style={{ letterSpacing: '-0.05em' }}
        >
          EVENTS
        </h1>
        <p className="text-white/50 mt-5 text-sm md:text-base max-w-2xl">
          Browse upcoming Album Studies events. Pay with MTN MoMo or Airtel Money, get your e-ticket by email.
        </p>
      </div>

      {events.length === 0 ? (
        <div className="glass-card rounded-2xl p-16 text-center">
          <p className="text-white/40 text-sm">No events on sale right now. Check back soon.</p>
        </div>
      ) : (
        <ul className="space-y-5">
          {events.map((e) => {
            const minPrice = Math.min(...e.tiers.map((t) => t.priceUGX));
            const totalAvailable = e.tiers.reduce((sum, t) => sum + (t.capacity - t.sold), 0);
            return (
              <li key={e.id}>
                <Link
                  href={`/events/${e.slug}`}
                  className="block glass-card rounded-2xl p-6 md:p-8 hover:border-mustard/30 transition-colors group"
                >
                  <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] tracking-[0.3em] uppercase text-mustard/70 font-mono">
                        {formatDate(e.startsAt)}
                      </p>
                      <h2 className="font-aicon text-2xl md:text-3xl text-offwhite mt-2 group-hover:text-mustard transition-colors" style={{ letterSpacing: '-0.05em' }}>
                        {e.title}
                      </h2>
                      <p className="text-xs text-white/40 mt-2">{e.venue}</p>
                      {e.description && (
                        <p className="text-sm text-white/55 mt-3 line-clamp-2 max-w-2xl">{e.description}</p>
                      )}
                    </div>
                    <div className="md:text-right md:min-w-[180px]">
                      <p className="text-[10px] tracking-[0.2em] uppercase text-white/40">From</p>
                      <p className="text-2xl font-semibold text-offwhite mt-1">{formatUGX(minPrice)}</p>
                      <p className="text-[10px] text-white/40 mt-2">
                        {totalAvailable > 0 ? `${totalAvailable} tickets left` : 'Sold out'}
                      </p>
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
