import { NextResponse } from 'next/server';
import { authMode } from '@/lib/auth';
import { assertDemoRequest, demoSessions } from '@/lib/demo-session';
import { RuleError } from '@/lib/domain';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function gate(request: Request) {
  if (authMode() !== 'demo') throw new RuleError('Demo sign-in is unavailable in live mode.', 404);
  assertDemoRequest(request);
  const origin = request.headers.get('origin');
  if (origin && origin !== (process.env.APP_ORIGIN || 'http://localhost:3000')) throw new RuleError('Origin is not allowed.', 403);
}
function failure(error: unknown) {
  return NextResponse.json({ error: error instanceof RuleError ? error.message : 'Unable to update simulated session.' }, { status: error instanceof RuleError ? error.status : 500, headers: { 'Cache-Control': 'no-store' } });
}
export async function POST(request: Request) {
  try {
    gate(request);
    if (!request.headers.get('content-type')?.includes('application/json')) throw new RuleError('JSON body required.', 415);
    const raw = await request.text();
    if (raw.length > 1000) throw new RuleError('Request too large.', 413);
    let body;
    try { body = JSON.parse(raw); } catch { throw new RuleError('Invalid JSON.', 400); }
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new RuleError('Invalid simulated sign-in.', 400);
    return NextResponse.json(demoSessions().issue(body.identity), { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { return failure(error); }
}
export async function DELETE(request: Request) {
  try {
    gate(request);
    const token = request.headers.get('authorization')?.match(/^Demo (demo-[a-f0-9]{64})$/)?.[1];
    if (!token) throw new RuleError('A simulated session is required.', 401);
    demoSessions().revoke(token);
    return NextResponse.json({ simulated: true, signedOut: true }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { return failure(error); }
}
