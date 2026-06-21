import { NextResponse } from 'next/server';

const rateLimitBuckets = new Map<string, { count: number; windowStart: number }>();
const DB_REQUESTS_PER_SECOND = Math.max(1, Number(process.env.DB_REQUESTS_PER_SECOND ?? 10));

function getClientId(request: Request): string {
  return (
    request.headers.get('cf-connecting-ip') ??
    request.headers.get('x-real-ip') ??
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    'local'
  );
}

export function json(data: unknown, status = 200, headers?: HeadersInit) {
  return NextResponse.json(data, { status, headers });
}

export async function parseJson<T>(request: Request): Promise<T> {
  return request.json() as Promise<T>;
}

export function checkRateLimit(request: Request): Response | null {
  const now = Date.now();
  const clientId = getClientId(request);
  const bucket = rateLimitBuckets.get(clientId);

  const headers = {
    'X-RateLimit-Limit': String(DB_REQUESTS_PER_SECOND)
  };

  if (!bucket || now - bucket.windowStart >= 1000) {
    rateLimitBuckets.set(clientId, { count: 1, windowStart: now });
    return null;
  }

  if (bucket.count >= DB_REQUESTS_PER_SECOND) {
    return NextResponse.json(
      { error: 'Too many database requests. Please retry in a second.' },
      {
        status: 429,
        headers: {
          ...headers,
          'X-RateLimit-Remaining': '0',
          'Retry-After': '1'
        }
      }
    );
  }

  bucket.count += 1;
  return null;
}

export async function withRateLimit(
  request: Request,
  handler: () => Promise<Response>
): Promise<Response> {
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-proofloop-api-key'
      }
    });
  }

  const limited = checkRateLimit(request);
  if (limited) return limited;
  return handler();
}

export const runtime = 'nodejs';
