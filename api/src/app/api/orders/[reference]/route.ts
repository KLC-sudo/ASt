import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const PUBLIC_FIELDS = {
  id: true,
  reference: true,
  status: true,
  amountUGX: true,
  quantity: true,
  customerName: true,
  createdAt: true,
  paidAt: true,
  tier: { select: { name: true, event: { select: { title: true, slug: true, venue: true, startsAt: true } } } },
} as const;

export async function GET(_req: NextRequest, { params }: { params: Promise<{ reference: string }> }) {
  const { reference } = await params;
  if (!reference || !/^TKT-[A-Z0-9-]+$/i.test(reference)) {
    return NextResponse.json({ error: 'Invalid reference format' }, { status: 400 });
  }

  const order = await prisma.order.findUnique({
    where: { reference: reference.toUpperCase() },
    select: PUBLIC_FIELDS,
  });
  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

  return NextResponse.json(order, {
    headers: { 'Cache-Control': 'no-store' },
  });
}
