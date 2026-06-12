import { prisma } from '@/lib/prisma';
import { formatDate, formatUGX } from '@/lib/format';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { updateOrderStatus } from '../../actions';

const statusColors: Record<string, string> = {
  PENDING: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  PAID: 'text-green-400 bg-green-400/10 border-green-400/20',
  FAILED: 'text-red-400 bg-red-400/10 border-red-400/20',
  CANCELLED: 'text-white/40 bg-white/5 border-white/10',
  REFUNDED: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
};

export default async function OrderDetailPage({ params }: { params: { reference: string } }) {
  const order = await prisma.order.findUnique({
    where: { reference: params.reference },
    include: {
      tier: { include: { event: true } },
      tickets: true,
    },
  });

  if (!order) notFound();

  async function handleStatusUpdate(formData: FormData) {
    'use server';
    if (!order) return;
    const status = formData.get('status') as string;
    const notes = (formData.get('notes') as string) || undefined;
    await updateOrderStatus(order.reference, status, notes);
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/orders" className="text-xs text-white/40 hover:text-mustard transition-colors">
          ← Back to Orders
        </Link>
      </div>

      {/* Order Header */}
      <div className="glass-card rounded-xl p-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-[10px] text-white/40 uppercase tracking-wider">Order Reference</p>
            <h2 className="text-xl font-mono font-medium tracking-wide text-offwhite mt-1">{order.reference}</h2>
          </div>
          <span className={`text-[10px] font-semibold uppercase tracking-wider px-3 py-1 rounded-full border ${statusColors[order.status]}`}>
            {order.status}
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div>
            <p className="text-[10px] text-white/40 uppercase tracking-wider">Customer</p>
            <p className="text-sm text-offwhite mt-1">{order.customerName}</p>
            <p className="text-[10px] text-white/40">{order.customerEmail}</p>
            <p className="text-[10px] text-white/40">{order.customerPhone}</p>
          </div>
          <div>
            <p className="text-[10px] text-white/40 uppercase tracking-wider">Event</p>
            <p className="text-sm text-offwhite mt-1">{order.tier.event.title}</p>
            <p className="text-[10px] text-white/40">{order.tier.name}</p>
          </div>
          <div>
            <p className="text-[10px] text-white/40 uppercase tracking-wider">Amount</p>
            <p className="text-sm text-mustard mt-1 font-medium">{formatUGX(order.amountUGX)}</p>
            <p className="text-[10px] text-white/40">Qty: {order.quantity}</p>
          </div>
          <div>
            <p className="text-[10px] text-white/40 uppercase tracking-wider">Created</p>
            <p className="text-sm text-offwhite mt-1">{formatDate(order.createdAt)}</p>
            {order.paidAt && (
              <p className="text-[10px] text-green-400">Paid: {formatDate(order.paidAt)}</p>
            )}
          </div>
        </div>

        {order.paymentProvider && (
          <div className="mt-4 flex gap-4">
            <div>
              <p className="text-[10px] text-white/40 uppercase tracking-wider">Provider</p>
              <p className="text-sm text-offwhite mt-1">{order.paymentProvider}</p>
            </div>
            {order.paymentTxId && (
              <div>
                <p className="text-[10px] text-white/40 uppercase tracking-wider">TX ID</p>
                <p className="text-sm text-offwhite mt-1 font-mono">{order.paymentTxId}</p>
              </div>
            )}
          </div>
        )}

        {order.notes && (
          <div className="mt-4">
            <p className="text-[10px] text-white/40 uppercase tracking-wider">Notes</p>
            <p className="text-sm text-white/60 mt-1">{order.notes}</p>
          </div>
        )}
      </div>

      {/* Tickets */}
      {order.tickets.length > 0 && (
        <div className="glass-card rounded-xl p-6">
          <h3 className="text-sm font-medium tracking-wide text-offwhite mb-4">Tickets ({order.tickets.length})</h3>
          <div className="space-y-2">
            {order.tickets.map((ticket) => (
              <div key={ticket.id} className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/5">
                <div>
                  <p className="text-sm text-offwhite font-mono">{ticket.code}</p>
                  {ticket.attendeeName && <p className="text-[10px] text-white/40">{ticket.attendeeName}</p>}
                </div>
                <div className="text-right">
                  {ticket.checkedInAt ? (
                    <span className="text-[10px] text-green-400">Checked in {formatDate(ticket.checkedInAt)}</span>
                  ) : (
                    <span className="text-[10px] text-white/40">Not checked in</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Status Management */}
      <div className="glass-card rounded-xl p-6">
        <h3 className="text-sm font-medium tracking-wide text-offwhite mb-4">Update Status</h3>
        <form action={handleStatusUpdate} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-semibold tracking-wider text-white/40 uppercase">New Status</label>
              <select name="status" className="custom-input rounded-lg px-3 py-2.5 text-sm">
                {order.status !== 'PAID' && <option value="PAID">Mark as Paid</option>}
                {order.status !== 'FAILED' && <option value="FAILED">Mark as Failed</option>}
                {order.status !== 'CANCELLED' && <option value="CANCELLED">Cancel</option>}
                {order.status === 'PAID' && <option value="REFUNDED">Refund</option>}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-semibold tracking-wider text-white/40 uppercase">Notes (optional)</label>
              <input name="notes" defaultValue={order.notes ?? ''} className="custom-input rounded-lg px-3 py-2.5 text-sm" placeholder="Internal note..." />
            </div>
          </div>
          <button type="submit" className="btn-primary text-xs">
            Update Order Status
          </button>
        </form>
      </div>
    </div>
  );
}
