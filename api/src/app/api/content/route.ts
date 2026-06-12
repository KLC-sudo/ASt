import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleCorsPreFlight, withCors } from '@/lib/cors';

export const dynamic = 'force-dynamic';

const CONTENT_KEY = 'content';
const publishSecret = process.env.CMS_PUBLISH_SECRET;

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function OPTIONS(request: NextRequest) {
  return handleCorsPreFlight(request);
}

// GET /api/content — anyone can read
export async function GET(request: NextRequest) {
  const row = await prisma.siteConfig.findUnique({ where: { key: CONTENT_KEY } });
  const content = row?.value ?? {};
  return withCors(
    request,
    new Response(JSON.stringify(content), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      },
    }),
  );
}

// POST /api/content — requires publish key
export async function POST(request: NextRequest) {
  if (!publishSecret) {
    return withCors(
      request,
      new Response(JSON.stringify({ error: 'CMS_PUBLISH_SECRET not configured.' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
  }

  const provided = request.headers.get('x-publish-key');
  if (!provided || !constantTimeEqual(provided, publishSecret)) {
    return withCors(
      request,
      new Response(JSON.stringify({ error: 'Invalid publish key.' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return withCors(
      request,
      new Response(JSON.stringify({ error: 'Invalid JSON.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
  }

  await prisma.siteConfig.upsert({
    where: { key: CONTENT_KEY },
    update: { value: body as object },
    create: { key: CONTENT_KEY, value: body as object },
  });

  return withCors(
    request,
    new Response(JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json' },
    }),
  );
}
