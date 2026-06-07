import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleCorsPreFlight, withCors } from '@/lib/cors';

export const dynamic = 'force-dynamic';

export async function OPTIONS(request: NextRequest) {
  return handleCorsPreFlight(request);
}

export async function GET(request: NextRequest) {
  const rows = await prisma.siteConfig.findMany();
  const config: Record<string, unknown> = {};
  for (const row of rows) config[row.key] = row.value;
  return withCors(
    request,
    NextResponse.json({ config }, { headers: { 'Cache-Control': 'no-store' } }),
  );
}
