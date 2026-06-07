import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { formatDate, formatUGX } from '@/lib/format';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function OrderPage({ params }: { params: Promise<{ reference: string }> }) {
  const { reference } = await params;
  const order = await prisma.order.findUnique({
    where: { reference: reference.toUpperCase() },
    include: {
      tier: { include: { event: true } },
      tickets: true,
    },
  });
  if (!order) notFound();

  const isPaid = order.status === 'PAID';

  return (
    <main className="max-w-3xl mx-auto px-6 py-12 md:py-20">
      <Link href="/events" className="text-xs text-white/40 hover:text-mustard tracking-wider uppercase">
        ← All events
      </Link>

      <div className="mt-8 mb-8">
        <p className="text-[11px] tracking-[0.3em] uppercase text-mustard/80 font-medium">Order</p>
        <h1
          className="font-mono text-2xl md:text-3xl text-offwhite mt-3 break-all"
        >
          {order.reference}
        </h1>
      </div>

      <div className={`glass-card rounded-2xl p-6 md:p-8 mb-6 border-2 ${
        isPaid ? 'border-green-500/30' : order.status === 'PENDING' ? 'border-mustard/30' : 'border-red-500/30'
      }`}>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[10px] tracking-[0.3em] uppercase text-white/40">Status</p>
            <p className={`text-2xl font-semibold mt-1 ${
              isPaid ? 'text-green-400' : order.status === 'PENDING' ? 'text-mustard' : 'text-red-400'
            }`}>
              {order.status}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] tracking-[0.3em] uppercase text-white/40">Total</p>
            <p className="text-2xl font-semibold text-offwhite mt-1">{formatUGX(order.amountUGX)}</p>
          </div>
        </div>

        {isPaid ? (
          <div className="mt-6 pt-6 border-t border-white/5">
            <p className="text-sm text-white/70">
              <span className="text-green-400 font-medium">Payment confirmed.</span>{' '}
              {order.tickets.length > 0
                ? 'Your e-ticket has been emailed. You can also download it below.'
                : 'Your e-ticket is being generated and will arrive by email shortly.'}
            </p>
            {order.tickets.length > 0 && (
              <p className="text-xs text-white/40 mt-3 font-mono">
                {order.tickets.length} ticket{order.tickets.length !== 1 ? 's' : ''} issued
              </p>
            )}
          </div>
        ) : order.status === 'PENDING' ? (
          <div className="mt-6 pt-6 border-t border-white/5">
            <p className="text-sm text-white/70">
              We haven't received your payment yet. If you have already paid, your ticket will appear here automatically within a few minutes of the SMS arriving.
            </p>
            <Link
              href={`/checkout/${order.tierId}/pending/${order.reference}`}
              className="inline-block mt-4 text-xs text-mustard hover:text-mustard/80 tracking-wider uppercase"
            >
              View payment instructions →
            </Link>
          </div>
        ) : (
          <div className="mt-6 pt-6 border-t border-white/5">
            <p className="text-sm text-white/70">
              This order was {order.status.toLowerCase()}. If you believe this is an error, contact us with your reference.
            </p>
          </div>
        )}
      </div>

      <div className="glass-card rounded-2xl p-6 md:p-8 space-y-4 text-sm">
        <h2 className="text-xs font-semibold tracking-[0.2em] uppercase text-mustard/80 border-b border-white/5 pb-2">
          Order details
        </h2>
        <Row label="Event" value={order.tier.event.title} />
        <Row label="Tier" value={order.tier.name} />
        <Row label="Date" value={formatDate(order.tier.event.startsAt)} />
        <Row label="Venue" value={order.tier.event.venue} />
        <Row label="Quantity" value={String(order.quantity)} />
        <Row label="Buyer" value={order.customerName} />
        <Row label="Email" value={order.customerEmail} />
        <Row label="Phone" value={order.customerPhone} />
        <Row label="Created" value={formatDate(order.createdAt)} />
        {order.paidAt && <Row label="Paid" value={formatDate(order.paidAt)} />}
      </div>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-start gap-4">
      <span className="text-white/40 text-xs tracking-wider uppercase">{label}</span>
      <span className="text-offwhite text-right max-w-[60%]">{value}</span>
    </div>
  );
}
