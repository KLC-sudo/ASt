import { prisma } from '@/lib/prisma';
import { formatUGX } from '@/lib/format';

export default async function DashboardPage() {
  const [pendingCount, paidTodayAgg, totalOrders, failedWebhookCount, recentOrders, recentWebhooks] = await Promise.all([
    prisma.order.count({ where: { status: 'PENDING' } }),
    prisma.order.aggregate({
      _sum: { amountUGX: true },
      _count: true,
      where: { status: 'PAID', paidAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
    }),
    prisma.order.count(),
    prisma.webhookEvent.count({ where: { result: { in: ['PARSE_FAILED', 'AMOUNT_MISMATCH', 'ORDER_NOT_FOUND'] } } }),
    prisma.order.findMany({ orderBy: { createdAt: 'desc' }, take: 5, include: { tier: { include: { event: true } } } }),
    prisma.webhookEvent.findMany({ orderBy: { processedAt: 'desc' }, take: 5 }),
  ]);

  const stats = [
    { label: 'Pending orders', value: pendingCount, accent: 'text-mustard' },
    { label: "Paid today", value: paidTodayAgg._count, sub: formatUGX(paidTodayAgg._sum.amountUGX ?? 0), accent: 'text-green-400' },
    { label: 'Total orders', value: totalOrders, accent: 'text-bluepurple' },
    { label: 'Failed webhooks', value: failedWebhookCount, accent: 'text-red-400' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-medium tracking-wide text-offwhite">Dashboard</h2>
        <p className="text-xs text-white/40 mt-1">Overview of ticketing activity and webhook health.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="glass-card rounded-xl p-5">
            <p className="text-[10px] tracking-[0.2em] uppercase text-white/40 font-semibold">{s.label}</p>
            <p className={`text-3xl font-semibold mt-3 ${s.accent}`}>{s.value}</p>
            {s.sub && <p className="text-[11px] text-white/50 mt-1">{s.sub}</p>}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card rounded-xl p-5">
          <h3 className="text-xs font-semibold tracking-[0.2em] uppercase text-mustard/80 mb-4 border-b border-white/5 pb-2">
            Recent orders
          </h3>
          {recentOrders.length === 0 ? (
            <p className="text-xs text-white/30 py-6 text-center">No orders yet.</p>
          ) : (
            <ul className="space-y-3">
              {recentOrders.map((o) => (
                <li key={o.id} className="flex justify-between items-center text-xs">
                  <div>
                    <p className="text-offwhite font-mono">{o.reference}</p>
                    <p className="text-white/40 mt-0.5">{o.tier.event.title} · {o.customerName}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] uppercase tracking-wider ${
                    o.status === 'PAID' ? 'bg-green-500/10 text-green-400' :
                    o.status === 'PENDING' ? 'bg-mustard/10 text-mustard' :
                    'bg-red-500/10 text-red-400'
                  }`}>{o.status}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="glass-card rounded-xl p-5">
          <h3 className="text-xs font-semibold tracking-[0.2em] uppercase text-mustard/80 mb-4 border-b border-white/5 pb-2">
            Recent webhook events
          </h3>
          {recentWebhooks.length === 0 ? (
            <p className="text-xs text-white/30 py-6 text-center">No webhooks received yet.</p>
          ) : (
            <ul className="space-y-3">
              {recentWebhooks.map((w) => (
                <li key={w.id} className="flex justify-between items-center text-xs">
                  <div>
                    <p className="text-offwhite font-mono">{w.fromAddress ?? 'unknown'}</p>
                    <p className="text-white/40 mt-0.5 truncate max-w-[280px]">{w.smsText ?? '—'}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] uppercase tracking-wider ${
                    w.result === 'MATCHED' ? 'bg-green-500/10 text-green-400' :
                    w.result === 'DUPLICATE' || w.result === 'ALREADY_PROCESSED' ? 'bg-white/5 text-white/50' :
                    'bg-red-500/10 text-red-400'
                  }`}>{w.result}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
