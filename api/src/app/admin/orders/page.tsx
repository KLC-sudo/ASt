import { prisma } from '@/lib/prisma';
import { formatDate, formatUGX } from '@/lib/format';
import Link from 'next/link';

const statusColors: Record<string, string> = {
  PENDING: 'text-yellow-400 bg-yellow-400/10',
  PAID: 'text-green-400 bg-green-400/10',
  FAILED: 'text-red-400 bg-red-400/10',
  CANCELLED: 'text-white/40 bg-white/5',
  REFUNDED: 'text-orange-400 bg-orange-400/10',
};

export default async function OrdersPage() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: {
      tier: { include: { event: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-medium tracking-wide text-offwhite">Orders</h2>
        <p className="text-xs text-white/40 mt-1">All ticket orders, newest first.</p>
      </div>

      {orders.length === 0 ? (
        <div className="glass-card rounded-xl p-12 text-center">
          <p className="text-white/40 text-sm">No orders yet.</p>
        </div>
      ) : (
        <div className="glass-card rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="px-4 py-3 text-white/40 font-semibold uppercase tracking-wider text-[10px]">Reference</th>
                  <th className="px-4 py-3 text-white/40 font-semibold uppercase tracking-wider text-[10px]">Customer</th>
                  <th className="px-4 py-3 text-white/40 font-semibold uppercase tracking-wider text-[10px]">Event</th>
                  <th className="px-4 py-3 text-white/40 font-semibold uppercase tracking-wider text-[10px] text-right">Amount</th>
                  <th className="px-4 py-3 text-white/40 font-semibold uppercase tracking-wider text-[10px]">Status</th>
                  <th className="px-4 py-3 text-white/40 font-semibold uppercase tracking-wider text-[10px]">Created</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/admin/orders/${o.reference}`} className="font-mono text-offwhite hover:text-mustard transition-colors">
                        {o.reference}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-offwhite">{o.customerName}</td>
                    <td className="px-4 py-3 text-white/60">{o.tier.event.title}</td>
                    <td className="px-4 py-3 text-offwhite text-right font-medium">{formatUGX(o.amountUGX)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusColors[o.status] || 'text-white/40 bg-white/5'}`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-white/40">{formatDate(o.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
