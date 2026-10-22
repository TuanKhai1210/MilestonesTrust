import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, unlinkSync, rmdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createDemoSessions } from '../src/lib/demo-session';
import { authenticate } from '../src/lib/auth';
import { POST as signIn, DELETE as signOut } from '../src/app/api/demo/session/route';
import { POST as action } from '../src/app/api/actions/route';
import { GET as state } from '../src/app/api/state/route';
import { store } from '../src/lib/domain';

test('simulated sessions expire, revoke independently and never trust caller-edited roles', () => {
  let clock = 1000;
  const sessions = createDemoSessions(() => clock, 100);
  const team = sessions.issue('team');
  const sponsor = sessions.issue('sponsor');
  assert.notEqual(team.token, sponsor.token);
  team.actor.roles.push('mt_admin');
  assert.deepEqual(sessions.verify(team.token).roles, ['mt_member', 'mt_team']);
  assert.throws(() => sessions.verify('invented'), /session ended/);
  assert.throws(() => sessions.issue('superadmin'), /Choose/);
  sessions.revoke(team.token);
  assert.throws(() => sessions.verify(team.token), /session ended/);
  assert.equal(sessions.verify(sponsor.token).sub, 'demo-sponsor');
  clock = sponsor.expiresAt;
  assert.throws(() => sessions.verify(sponsor.token), /session ended/);
});

test('simulated sign-in drives actual server permissions and sign-out invalidates the token', async t => {
  const previous = { ...process.env };
  const directory = mkdtempSync(path.join(tmpdir(), 'milestone-session-'));
  process.env.AUTH_MODE = 'demo';
  process.env.APP_ORIGIN = 'http://localhost:3000';
  process.env.DATABASE_PATH = path.join(directory, 'campaign.sqlite');
  Object.assign(process.env, { NODE_ENV: 'development' });
  t.after(() => {
    try {
      store().close();
      for (const file of ['campaign.sqlite', 'campaign.sqlite-wal', 'campaign.sqlite-shm']) {
        try { unlinkSync(path.join(directory, file)); }
        catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error; }
      }
      rmdirSync(directory);
    } finally { process.env = previous; }
  });
  const tokens: string[] = [];
  async function login(identity: string, claimedRoles: string[] = []) {
    const response = await signIn(new Request('http://localhost:3000/api/demo/session', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'http://localhost:3000' }, body: JSON.stringify({ identity, roles: claimedRoles }),
    }));
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    const session = await response.json();
    assert.equal(session.simulated, true);
    tokens.push(session.token);
    return session;
  }
  const team = await login('team');
  const admin = await login('admin', ['mt_team', 'mt_sponsor']);
  assert.deepEqual(admin.actor.roles, ['mt_member', 'mt_admin']);
  const request = { action: 'request', milestoneId: 'M1', amount: 20000000, recipient: 'Synthetic supplier', purpose: 'Synthetic filters' };
  const write = (token?: string) => action(new Request('http://localhost:3000/api/actions', {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Demo ${token}` } : {}) }, body: JSON.stringify(request),
  }));
  assert.equal((await write()).status, 401);
  assert.equal((await write(admin.token)).status, 403);
  assert.equal((await write(team.token)).status, 200);
  const response = await state(new Request('http://localhost:3000/api/state', { headers: { Authorization: `Demo ${team.token}` } }));
  assert.equal((await response.json()).actor.sub, 'demo-team');
  await assert.rejects(authenticate(new Request('http://localhost:3000/api/actions', { headers: { Authorization: 'Demo invalid', 'x-demo-role': 'sponsor' } })), /Invalid simulated/);
  const logout = await signOut(new Request('http://localhost:3000/api/demo/session', { method: 'DELETE', headers: { Authorization: `Demo ${team.token}` } }));
  assert.equal(logout.status, 200);
  assert.equal((await write(team.token)).status, 401);
  const publicResponse = await state(new Request('http://localhost:3000/api/state'));
  assert.equal((await publicResponse.json()).actor, null);
  for (const token of tokens) await signOut(new Request('http://localhost:3000/api/demo/session', { method: 'DELETE', headers: { Authorization: `Demo ${token}` } }));
});

test('simulated session endpoint rejects live/production use, remote URLs, cross-origin and malformed sign-in', async () => {
  const previous = { ...process.env };
  try {
    process.env.AUTH_MODE = 'demo';
    Object.assign(process.env, { NODE_ENV: 'development' });
    const request = (url: string, body = '{"identity":"team"}', extra: Record<string, string> = {}) => new Request(url, { method: 'POST', headers: { 'Content-Type': 'application/json', ...extra }, body });
    assert.equal((await signIn(request('https://example.com/api/demo/session'))).status, 403);
    assert.equal((await signIn(request('http://localhost:3000/api/demo/session', '{}', { Origin: 'https://other.example' }))).status, 403);
    for (const body of ['{', '[]', 'null', '{"identity":"unknown"}']) assert.equal((await signIn(request('http://localhost:3000/api/demo/session', body))).status, 400);
    assert.equal((await signIn(request('http://localhost:3000/api/demo/session', 'x'.repeat(1001)))).status, 413);
    process.env.AUTH_MODE = 'tidecloak';
    assert.equal((await signIn(request('http://localhost:3000/api/demo/session'))).status, 404);
    process.env.AUTH_MODE = 'demo'; Object.assign(process.env, { NODE_ENV: 'production' });
    assert.equal((await signIn(request('http://localhost:3000/api/demo/session'))).status, 503);
  } finally { process.env = previous; }
});
