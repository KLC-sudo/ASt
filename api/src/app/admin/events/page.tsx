import { prisma } from '@/lib/prisma';
import { formatDate } from '@/lib/format';
import Link from 'next/link';

const statusColors: Record<string, string> = {
  DRAFT: 'text-yellow-400',
  PUBLISHED: 'text-green-400',
  ARCHIVED: 'text-white/40',
  SOLD_OUT: 'text-red-400',
};

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
        <Link href="/admin/events/new" className="btn-primary text-xs">
          + New Event
        </Link>
      </div>

      {events.length === 0 ? (
        <div className="glass-card rounded-xl p-12 text-center">
          <p className="text-white/40 text-sm mb-4">No events yet.</p>
          <Link href="/admin/events/new" className="text-mustard text-xs font-semibold uppercase tracking-wider hover:underline">
            Create your first event
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {events.map((e) => {
            const orderCount = e.tiers.reduce((sum, t) => sum + t._count.orders, 0);
            const totalSold = e.tiers.reduce((sum, t) => sum + t.sold, 0);
            const totalCapacity = e.tiers.reduce((sum, t) => sum + t.capacity, 0);
            return (
              <li key={e.id}>
                <Link href={`/admin/events/${e.id}`} className="glass-card rounded-xl p-5 flex justify-between items-center hover:border-white/10 transition-colors">
                  <div>
                    <p className="text-offwhite font-medium">{e.title}</p>
                    <p className="text-xs text-white/40 mt-1">{formatDate(e.startsAt)} · {e.venue}</p>
                    <p className="text-[10px] text-white/30 mt-1 font-mono">/{e.slug}</p>
                  </div>
                  <div className="text-right text-xs">
                    <p className="text-offwhite">{e._count.tiers} tiers · {orderCount} orders</p>
                    <p className="text-white/40 mt-1">{totalSold}/{totalCapacity} sold</p>
                    <p className={`mt-1 font-medium ${statusColors[e.status] || 'text-white/40'}`}>{e.status}</p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
