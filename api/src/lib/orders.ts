import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { generateOrderReference } from './reference';

export const createOrderSchema = z.object({
  tierId: z.string().cuid(),
  customerName: z.string().trim().min(2, 'Name is required').max(120),
  customerEmail: z.string().trim().toLowerCase().email('Valid email required'),
  customerPhone: z.string().trim().min(8, 'Phone is required').max(20),
  quantity: z.coerce.number().int().min(1, 'At least 1 ticket').max(20, 'Max 20 per order'),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export type CreateOrderResult =
  | { ok: true; orderId: string; reference: string; amountUGX: number }
  | { ok: false; error: string; status: 400 | 404 | 409 | 500 };

export async function createOrder(input: CreateOrderInput): Promise<CreateOrderResult> {
  const parsed = createOrderSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input', status: 400 };
  }
  const data = parsed.data;

  return await prisma.$transaction(async (tx) => {
    const tier = await tx.ticketTier.findUnique({
      where: { id: data.tierId },
      include: { event: true },
    });
    if (!tier) return { ok: false, error: 'Ticket tier not found', status: 404 } as const;
    if (tier.event.status !== 'PUBLISHED') return { ok: false, error: 'Event is not on sale', status: 409 } as const;
    if (tier.sold + data.quantity > tier.capacity) {
      return { ok: false, error: 'Not enough tickets available', status: 409 } as const;
    }

    const amountUGX = tier.priceUGX * data.quantity;
    const reference = await generateOrderReference(tier.event.slug);

    const order = await tx.order.create({
      data: {
        reference,
        tierId: tier.id,
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        customerPhone: data.customerPhone,
        quantity: data.quantity,
        amountUGX,
        status: 'PENDING',
      },
    });

    await tx.ticketTier.update({
      where: { id: tier.id },
      data: { sold: { increment: data.quantity } },
    });

    return {
      ok: true,
      orderId: order.id,
      reference: order.reference,
      amountUGX: order.amountUGX,
    } as const;
  });
}
