import { NextRequest, NextResponse } from 'next/server';

const ALLOWED_METHODS = 'GET, PUT, OPTIONS';
const ALLOWED_HEADERS = 'Content-Type, X-Publish-Key';
const MAX_AGE = '86400';

function buildHeaders(request: NextRequest): Record<string, string> {
  const origin = request.headers.get('origin') ?? '*';
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': ALLOWED_METHODS,
    'Access-Control-Allow-Headers': ALLOWED_HEADERS,
    'Access-Control-Max-Age': MAX_AGE,
    'Vary': 'Origin',
  };
}

export function handleCorsPreFlight(request: NextRequest) {
  return new NextResponse(null, { status: 204, headers: buildHeaders(request) });
}

export function withCors(request: NextRequest, response: NextResponse): NextResponse {
  for (const [k, v] of Object.entries(buildHeaders(request))) {
    response.headers.set(k, v);
  }
  return response;
}
