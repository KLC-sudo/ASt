'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const eventSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens'),
  description: z.string().min(1),
  venue: z.string().min(1),
  startsAt: z.string().min(1),
  endsAt: z.string().min(1),
  capacity: z.coerce.number().int().min(1),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED', 'SOLD_OUT']).default('DRAFT'),
  fornaxCode: z.string().optional().nullable(),
  ventusNumber: z.string().optional().nullable(),
  coverImage: z.string().optional().nullable(),
});

const tierSchema = z.object({
  name: z.string().min(1),
  priceUGX: z.coerce.number().int().min(0),
  capacity: z.coerce.number().int().min(1),
});

// ── Event CRUD ──────────────────────────────────────────

export async function createEvent(formData: FormData) {
  const parsed = eventSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }

  const existing = await prisma.event.findUnique({ where: { slug: parsed.data.slug } });
  if (existing) {
    return { error: 'An event with this slug already exists' };
  }

  await prisma.event.create({ data: parsed.data });
  revalidatePath('/admin/events');
  return { ok: true };
}

export async function updateEvent(id: string, formData: FormData) {
  const parsed = eventSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }

  const existing = await prisma.event.findUnique({ where: { slug: parsed.data.slug } });
  if (existing && existing.id !== id) {
    return { error: 'An event with this slug already exists' };
  }

  await prisma.event.update({ where: { id }, data: parsed.data });
  revalidatePath('/admin/events');
  revalidatePath(`/admin/events/${id}`);
  return { ok: true };
}

export async function deleteEvent(id: string) {
  await prisma.event.delete({ where: { id } });
  revalidatePath('/admin/events');
  return { ok: true };
}

// ── Tier CRUD ───────────────────────────────────────────

export async function addTier(eventId: string, formData: FormData) {
  const parsed = tierSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }

  const maxSort = await prisma.ticketTier.aggregate({
    where: { eventId },
    _max: { sortOrder: true },
  });

  await prisma.ticketTier.create({
    data: {
      eventId,
      ...parsed.data,
      sortOrder: (maxSort._max.sortOrder ?? -1) + 1,
    },
  });
  revalidatePath(`/admin/events/${eventId}`);
  return { ok: true };
}

export async function updateTier(id: string, eventId: string, formData: FormData) {
  const parsed = tierSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }

  await prisma.ticketTier.update({ where: { id }, data: parsed.data });
  revalidatePath(`/admin/events/${eventId}`);
  return { ok: true };
}

export async function deleteTier(id: string, eventId: string) {
  const tier = await prisma.ticketTier.findUnique({
    where: { id },
    include: { _count: { select: { orders: true } } },
  });
  if (tier && tier._count.orders > 0) {
    return { error: 'Cannot delete a tier with existing orders' };
  }

  await prisma.ticketTier.delete({ where: { id } });
  revalidatePath(`/admin/events/${eventId}`);
  return { ok: true };
}

// ── Order Status Management ─────────────────────────────

export async function updateOrderStatus(reference: string, status: string, notes?: string) {
  const validStatus = z.enum(['PAID', 'FAILED', 'CANCELLED', 'REFUNDED']).parse(status);

  const order = await prisma.order.findUnique({
    where: { reference },
    include: { tier: true },
  });
  if (!order) return { error: 'Order not found' };

  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { reference },
      data: {
        status: validStatus,
        notes: notes || order.notes,
        paidAt: validStatus === 'PAID' ? new Date() : null,
      },
    });

    // Adjust tier sold count on status change
    if (order.status !== 'PAID' && validStatus === 'PAID') {
      // Marking as paid: increment sold
      await tx.ticketTier.update({
        where: { id: order.tierId },
        data: { sold: { increment: order.quantity } },
      });
    } else if (order.status === 'PAID' && validStatus !== 'PAID') {
      // Un-marking as paid: decrement sold
      await tx.ticketTier.update({
        where: { id: order.tierId },
        data: { sold: { decrement: order.quantity } },
      });
    }
  });

  revalidatePath('/admin/orders');
  revalidatePath(`/admin/orders/${reference}`);
  revalidatePath('/admin/dashboard');
  return { ok: true };
}
