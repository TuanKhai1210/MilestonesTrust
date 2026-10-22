import { NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth';
import { store, RuleError } from '@/lib/domain';
export const runtime = 'nodejs';
export async function POST(request: Request) {
  try {
    const origin = request.headers.get('origin');
    const expected = process.env.APP_ORIGIN || 'http://localhost:3000';
    if (origin && origin !== expected) throw new RuleError('Origin is not allowed.', 403);
    if (!request.headers.get('content-type')?.includes('application/json')) throw new RuleError('JSON body required.', 415);
    const actor = await authenticate(request);
    const raw = await request.text();
    if (raw.length > 10000) throw new RuleError('Request too large.', 413);
    let body;
    try { body = JSON.parse(raw); } catch { throw new RuleError('Invalid JSON.', 400); }
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new RuleError('Invalid action.', 400);
    return NextResponse.json(store().act(actor, body), { headers: { 'Cache-Control': 'no-store' } });
  } catch (e) { return NextResponse.json({ error: e instanceof RuleError ? e.message : 'Action could not be completed.' }, { status: e instanceof RuleError ? e.status : 500 }); }
}
