import Link from 'next/link';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function OrderLookupPage({ searchParams }: { searchParams: Promise<{ ref?: string }> }) {
  const { ref } = await searchParams;
  let order = null;
  if (ref) {
    order = await prisma.order.findUnique({
      where: { reference: ref.toUpperCase() },
      select: { reference: true, status: true },
    });
  }

  return (
    <main className="max-w-2xl mx-auto px-6 py-16 md:py-24">
      <p className="text-[11px] tracking-[0.3em] uppercase text-mustard/80 font-medium">Find your order</p>
      <h1
        className="font-aicon text-4xl md:text-5xl text-offwhite mt-3"
        style={{ letterSpacing: '-0.05em' }}
      >
        MY ORDER
      </h1>
      <p className="text-white/50 text-sm mt-3">
        Enter the reference number we sent you (e.g. TKT-EVT2026-A7K2B9).
      </p>

      <form action="/order" method="get" className="mt-10 glass-card rounded-2xl p-6 flex flex-col sm:flex-row gap-3">
        <input
          name="ref"
          type="text"
          required
          pattern="TKT-[A-Z0-9-]+"
          placeholder="TKT-…"
          className="custom-input rounded-xl px-4 py-3 text-sm flex-1 font-mono"
        />
        <button type="submit" className="btn-primary">Look up</button>
      </form>

      {ref && !order && (
        <p className="mt-6 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
          No order found for {ref}. Double-check the reference.
        </p>
      )}

      {order && (
        <Link
          href={`/order/${order.reference}`}
          className="mt-6 block glass-card rounded-2xl p-6 hover:border-mustard/30 transition-colors"
        >
          <p className="text-[10px] tracking-[0.3em] uppercase text-mustard/70 font-mono">{order.reference}</p>
          <p className="text-offwhite font-medium mt-1">Status: <span className="text-mustard">{order.status}</span></p>
          <p className="text-xs text-white/40 mt-2">Click to view full details →</p>
        </Link>
      )}
    </main>
  );
}
