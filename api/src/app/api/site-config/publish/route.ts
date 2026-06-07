import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { handleCorsPreFlight, withCors } from '@/lib/cors';

export const dynamic = 'force-dynamic';

const publishSecret = process.env.CMS_PUBLISH_SECRET;

const bodySchema = z.object({
  config: z.record(z.string(), z.unknown()),
});

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function jsonWithCors(request: NextRequest, body: unknown, init?: ResponseInit) {
  return withCors(request, NextResponse.json(body, init));
}

export async function OPTIONS(request: NextRequest) {
  return handleCorsPreFlight(request);
}

export async function PUT(request: NextRequest) {
  if (!publishSecret) {
    return jsonWithCors(
      request,
      { error: 'CMS_PUBLISH_SECRET is not configured on the server.' },
      { status: 503 },
    );
  }

  const provided = request.headers.get('x-publish-key');
  if (!provided || !constantTimeEqual(provided, publishSecret)) {
    return jsonWithCors(request, { error: 'Invalid publish key.' }, { status: 401 });
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return jsonWithCors(request, { error: 'Invalid JSON body.' }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return jsonWithCors(
      request,
      { error: parsed.error.issues[0]?.message ?? 'Invalid input' },
      { status: 400 },
    );
  }

  const entries = Object.entries(parsed.data.config);
  await prisma.$transaction(
    entries.map(([key, value]) =>
      prisma.siteConfig.upsert({
        where: { key },
        update: { value: value as object },
        create: { key, value: value as object },
      }),
    ),
  );

  return jsonWithCors(request, { ok: true, count: entries.length });
}
