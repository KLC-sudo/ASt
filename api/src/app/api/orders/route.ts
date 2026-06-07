import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createOrder } from '@/lib/orders';

const bodySchema = z.object({
  tierId: z.string().cuid(),
  customerName: z.string().trim().min(2).max(120),
  customerEmail: z.string().trim().toLowerCase().email(),
  customerPhone: z.string().trim().min(8).max(20),
  quantity: z.coerce.number().int().min(1).max(20),
});

export async function POST(req: NextRequest) {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid input' },
      { status: 400 },
    );
  }

  const result = await createOrder(parsed.data);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json({
    orderId: result.orderId,
    reference: result.reference,
    amountUGX: result.amountUGX,
  });
}
