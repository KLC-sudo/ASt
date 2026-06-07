import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const rows = await prisma.siteConfig.findMany();
  const config: Record<string, unknown> = {};
  for (const row of rows) config[row.key] = row.value;
  return NextResponse.json(
    { config },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
