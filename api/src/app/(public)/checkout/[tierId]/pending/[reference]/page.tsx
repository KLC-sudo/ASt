import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { formatUGX } from '@/lib/format';
import { PendingPoller } from '@/components/public/PendingPoller';

export const dynamic = 'force-dynamic';

export default async function PendingPage({ params }: { params: Promise<{ tierId: string; reference: string }> }) {
  const { tierId, reference } = await params;
  const upperRef = reference.toUpperCase();

  const order = await prisma.order.findUnique({
    where: { reference: upperRef },
    include: { tier: { include: { event: true } } },
  });
  if (!order || order.tierId !== tierId) notFound();

  const fornaxCode = order.tier.event.fornaxCode ?? process.env.FORNAX_MERCHANT_CODE ?? 'XXXX';
  const ventusNumber = order.tier.event.ventusNumber ?? process.env.VENTUS_NUMBER ?? '';
  const supportPhone = process.env.PAYMENT_SUPPORT_PHONE ?? ventusNumber ?? '+0000000000';

  return (
    <main className="max-w-3xl mx-auto px-6 py-12 md:py-20">
      <div className="mb-8">
        <p className="text-[11px] tracking-[0.3em] uppercase text-mustard/80 font-medium">Awaiting payment</p>
        <h1
          className="font-aicon text-3xl md:text-4xl text-offwhite mt-3"
          style={{ letterSpacing: '-0.05em' }}
        >
          {order.tier.event.title}
        </h1>
        <p className="text-white/50 text-sm mt-2">{order.tier.name}</p>
      </div>

      <div className="glass-card rounded-2xl p-6 md:p-8 mb-6">
        <p className="text-[10px] tracking-[0.3em] uppercase text-white/40 font-mono">Your reference</p>
        <p className="text-3xl md:text-4xl font-mono font-semibold text-mustard mt-2 break-all">{order.reference}</p>
        <p className="text-xs text-white/40 mt-2">Include this in the payment note / message.</p>
      </div>

      <div className="glass-card rounded-2xl p-6 md:p-8 space-y-6">
        <div>
          <p className="text-[10px] tracking-[0.3em] uppercase text-white/40">Amount to pay</p>
          <p className="text-4xl md:text-5xl font-semibold text-offwhite mt-2">{formatUGX(order.amountUGX)}</p>
        </div>

        <div className="border-t border-white/5 pt-6 space-y-4 text-sm text-white/70">
          <p>
            <span className="text-mustard font-medium">Fornax:</span> Dial{' '}
            <code className="text-mustard font-mono">*{fornaxCode}#</code> → Merchant Payment → enter{' '}
            <strong className="text-offwhite">{formatUGX(order.amountUGX).replace('UGX ', '')}</strong> → reference{' '}
            <code className="text-mustard font-mono">{order.reference}</code>
          </p>
          {ventusNumber && (
            <p>
              <span className="text-mustard font-medium">Ventus:</span> Send{' '}
              <strong className="text-offwhite">{formatUGX(order.amountUGX)}</strong> to{' '}
              <code className="text-mustard">{ventusNumber}</code> with reference{' '}
              <code className="text-mustard font-mono">{order.reference}</code>
            </p>
          )}
        </div>

        <a
          href={`https://wa.me/${supportPhone.replace(/[^\d+]/g, '').replace(/^\+/, '')}?text=${encodeURIComponent(
            `Hello, I have paid for order ${order.reference} (${formatUGX(order.amountUGX)}) for ${order.tier.event.title}. Please confirm.`,
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full text-center py-3 rounded-xl border border-green-500/30 bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-all text-sm font-medium tracking-wider uppercase"
        >
          I have paid — send screenshot on WhatsApp
        </a>
      </div>

      <PendingPoller reference={order.reference} />
    </main>
  );
}
