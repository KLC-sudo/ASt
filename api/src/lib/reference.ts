import { prisma } from '@/lib/prisma';

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const SUFFIX_LEN = 6;

function randomSuffix(): string {
  let out = '';
  for (let i = 0; i < SUFFIX_LEN; i++) {
    out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return out;
}

function normalizeSlug(input: string): string {
  return input
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '')
    .slice(0, 8) || 'EVT';
}

export async function generateOrderReference(eventSlug: string): Promise<string> {
  const tag = normalizeSlug(eventSlug);
  for (let attempt = 0; attempt < 6; attempt++) {
    const candidate = `TKT-${tag}-${randomSuffix()}`;
    const exists = await prisma.order.findUnique({ where: { reference: candidate }, select: { id: true } });
    if (!exists) return candidate;
  }
  const fallback = `TKT-${tag}-${Date.now().toString(36).toUpperCase().slice(-6)}`;
  return fallback;
}
