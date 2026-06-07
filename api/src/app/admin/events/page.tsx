import { prisma } from '@/lib/prisma';
import { formatDate } from '@/lib/format';

export default async function EventsPage() {
  const events = await prisma.event.findMany({
    orderBy: { startsAt: 'desc' },
    include: {
      tiers: { include: { _count: { select: { orders: true } } } },
      _count: { select: { tiers: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-medium tracking-wide text-offwhite">Events</h2>
          <p className="text-xs text-white/40 mt-1">Create and manage ticketed events.</p>
        </div>
        <button className="btn-primary text-xs" disabled>
          + New event (phase 5)
        </button>
      </div>

      {events.length === 0 ? (
        <div className="glass-card rounded-xl p-12 text-center">
          <p className="text-white/40 text-sm">No events yet. Phase 5 will add the create form.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {events.map((e) => {
            const orderCount = e.tiers.reduce((sum, t) => sum + t._count.orders, 0);
            return (
              <li key={e.id} className="glass-card rounded-xl p-5 flex justify-between items-center">
                <div>
                  <p className="text-offwhite font-medium">{e.title}</p>
                  <p className="text-xs text-white/40 mt-1">{formatDate(e.startsAt)} · {e.venue}</p>
                  <p className="text-[10px] text-white/30 mt-1 font-mono">/{e.slug}</p>
                </div>
                <div className="text-right text-xs">
                  <p className="text-offwhite">{e._count.tiers} tiers · {orderCount} orders</p>
                  <p className="text-white/40 mt-1">{e.status}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
