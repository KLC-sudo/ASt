import { prisma } from '@/lib/prisma';
import { formatDate, formatUGX } from '@/lib/format';
import Link from 'next/link';

export default async function OrdersPage() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: { tier: { include: { event: true } } },
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
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-white/40 tracking-wider uppercase text-[10px] border-b border-white/5">
                <th className="py-3 px-3">Reference</th>
                <th className="py-3 px-3">Event</th>
                <th className="py-3 px-3">Customer</th>
                <th className="py-3 px-3">Amount</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Created</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                  <td className="py-3 px-3 font-mono text-offwhite">{o.reference}</td>
                  <td className="py-3 px-3 text-white/70">{o.tier.event.title}</td>
                  <td className="py-3 px-3 text-white/70">{o.customerName}</td>
                  <td className="py-3 px-3 text-offwhite">{formatUGX(o.amountUGX)}</td>
                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase tracking-wider ${
                      o.status === 'PAID' ? 'bg-green-500/10 text-green-400' :
                      o.status === 'PENDING' ? 'bg-mustard/10 text-mustard' :
                      'bg-red-500/10 text-red-400'
                    }`}>{o.status}</span>
                  </td>
                  <td className="py-3 px-3 text-white/50">{formatDate(o.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
