import { NextRequest, NextResponse } from 'next/server';
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

function jsonWithCors(request: NextRequest, body: unknown, init?: ResponseInit) {
  return withCors(request, NextResponse.json(body, init));
}

export async function OPTIONS(request: NextRequest) {
  return handleCorsPreFlight(request);
}

// GET /api/content — anyone can read
export async function GET(request: NextRequest) {
  const row = await prisma.siteConfig.findUnique({ where: { key: CONTENT_KEY } });
  const content = row?.value ?? {};
  return jsonWithCors(request, content, {
    headers: { 'Cache-Control': 'no-store' },
  });
}

// POST /api/content — requires publish key
export async function POST(request: NextRequest) {
  if (!publishSecret) {
    return jsonWithCors(
      request,
      { error: 'CMS_PUBLISH_SECRET not configured.' },
      { status: 503 },
    );
  }

  const provided = request.headers.get('x-publish-key');
  if (!provided || !constantTimeEqual(provided, publishSecret)) {
    return jsonWithCors(request, { error: 'Invalid publish key.' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonWithCors(request, { error: 'Invalid JSON.' }, { status: 400 });
  }

  await prisma.siteConfig.upsert({
    where: { key: CONTENT_KEY },
    update: { value: body as object },
    create: { key: CONTENT_KEY, value: body as object },
  });

  return jsonWithCors(request, { ok: true });
}
