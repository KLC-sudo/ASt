import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

const publishSecret = process.env.CMS_PUBLISH_SECRET;

const bodySchema = z.object({
  config: z.record(z.string(), z.unknown()),
});

export async function PUT(req: NextRequest) {
  if (!publishSecret) {
    return NextResponse.json(
      { error: 'CMS_PUBLISH_SECRET is not configured on the server.' },
      { status: 503 },
    );
  }

  const provided = req.headers.get('x-publish-key');
  if (!provided || provided.length !== publishSecret.length) {
    return NextResponse.json({ error: 'Invalid publish key.' }, { status: 401 });
  }
  let diff = 0;
  for (let i = 0; i < provided.length; i++) diff |= provided.charCodeAt(i) ^ publishSecret.charCodeAt(i);
  if (diff !== 0) {
    return NextResponse.json({ error: 'Invalid publish key.' }, { status: 401 });
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 });
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

  return NextResponse.json({ ok: true, count: entries.length });
}
