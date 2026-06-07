import { prisma } from '@/lib/prisma';
import { formatDate, formatUGX } from '@/lib/format';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function EventDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = await prisma.event.findUnique({
    where: { slug },
    include: { tiers: { orderBy: { sortOrder: 'asc' } } },
  });
  if (!event || event.status !== 'PUBLISHED') notFound();

  return (
    <main className="max-w-5xl mx-auto px-6 py-12 md:py-20">
      <Link href="/events" className="text-xs text-white/40 hover:text-mustard tracking-wider uppercase">
        ← All events
      </Link>

      <div className="mt-8 mb-12">
        <p className="text-[11px] tracking-[0.3em] uppercase text-mustard/80 font-mono">
          {formatDate(event.startsAt)}
        </p>
        <h1
          className="font-aicon text-4xl md:text-6xl text-offwhite mt-3"
          style={{ letterSpacing: '-0.05em' }}
        >
          {event.title}
        </h1>
        <p className="text-white/50 mt-3 text-sm md:text-base">{event.venue}</p>
      </div>

      {event.description && (
        <div className="glass-card rounded-2xl p-6 md:p-8 mb-10">
          <p className="text-white/70 leading-relaxed whitespace-pre-line">{event.description}</p>
        </div>
      )}

      <div className="mb-6">
        <p className="text-[11px] tracking-[0.3em] uppercase text-mustard/80 font-medium">Ticket Tiers</p>
        <div className="w-8 h-px bg-mustard/40 mt-3"></div>
      </div>

      <ul className="space-y-4">
        {event.tiers.map((t) => {
          const remaining = t.capacity - t.sold;
          const soldOut = remaining <= 0;
          return (
            <li key={t.id} className="glass-card rounded-2xl p-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <div>
                <h3 className="text-offwhite font-medium text-lg">{t.name}</h3>
                <p className="text-xs text-white/40 mt-1">
                  {soldOut ? 'Sold out' : `${remaining} of ${t.capacity} available`}
                </p>
              </div>
              <div className="flex items-center gap-5">
                <p className="text-2xl font-semibold text-offwhite">{formatUGX(t.priceUGX)}</p>
                {soldOut ? (
                  <span className="text-xs text-white/40 uppercase tracking-wider">Sold out</span>
                ) : (
                  <Link href={`/checkout/${t.id}`} className="btn-primary text-xs">
                    Buy
                  </Link>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
