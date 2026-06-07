import { prisma } from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import { formatDate, formatUGX } from '@/lib/format';
import Link from 'next/link';
import { CheckoutForm } from '@/components/public/CheckoutForm';

export const dynamic = 'force-dynamic';

export default async function CheckoutPage({ params }: { params: Promise<{ tierId: string }> }) {
  const { tierId } = await params;
  const tier = await prisma.ticketTier.findUnique({
    where: { id: tierId },
    include: { event: true },
  });
  if (!tier) notFound();
  if (tier.event.status !== 'PUBLISHED') notFound();
  if (tier.sold >= tier.capacity) redirect(`/events/${tier.event.slug}`);

  const fornaxCode = tier.event.fornaxCode ?? process.env.FORNAX_MERCHANT_CODE ?? 'XXXX';
  const ventusNumber = tier.event.ventusNumber ?? process.env.VENTUS_NUMBER ?? '';

  return (
    <main className="max-w-3xl mx-auto px-6 py-12 md:py-20">
      <Link href={`/events/${tier.event.slug}`} className="text-xs text-white/40 hover:text-mustard tracking-wider uppercase">
        ← {tier.event.title}
      </Link>

      <div className="mt-8 mb-10">
        <p className="text-[11px] tracking-[0.3em] uppercase text-mustard/80 font-medium">Checkout</p>
        <h1
          className="font-aicon text-3xl md:text-4xl text-offwhite mt-3"
          style={{ letterSpacing: '-0.05em' }}
        >
          {tier.name}
        </h1>
        <p className="text-white/50 text-sm mt-2">
          {tier.event.title} · {formatDate(tier.event.startsAt)} · {tier.event.venue}
        </p>
        <p className="text-2xl font-semibold text-offwhite mt-4">{formatUGX(tier.priceUGX)} <span className="text-sm font-normal text-white/40">/ ticket</span></p>
      </div>

      <CheckoutForm
        tierId={tier.id}
        pricePerTicket={tier.priceUGX}
        fornaxCode={fornaxCode}
        ventusNumber={ventusNumber}
      />
    </main>
  );
}
