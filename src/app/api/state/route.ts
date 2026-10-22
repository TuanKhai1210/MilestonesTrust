import { NextResponse } from 'next/server';
import { store, RuleError } from '@/lib/domain';
import { authenticate, authInfo } from '@/lib/auth';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET(request: Request) {
  try {
    const info = authInfo();
    let actor = null;
    if (request.headers.has('authorization') || request.headers.has('x-demo-role')) actor = await authenticate(request);
    return NextResponse.json({ ...store().snapshot(), auth: info, actor }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e) { return NextResponse.json({ error: e instanceof RuleError ? e.message : 'Unable to read campaign.' }, { status: e instanceof RuleError ? e.status : 500 }); }
}
