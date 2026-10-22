import { randomBytes } from 'node:crypto';
import { RuleError, type Actor, type Role } from './domain';

export const DEMO_IDENTITIES = ['team', 'sponsor', 'auditor', 'admin'] as const;
export function demoActor(identity: unknown): Actor {
  if (typeof identity !== 'string' || !DEMO_IDENTITIES.includes(identity as typeof DEMO_IDENTITIES[number])) throw new RuleError('Choose a simulated demo account.', 400);
  return { sub: `demo-${identity}`, name: `Demo ${identity}`, roles: ['mt_member', `mt_${identity}` as Role] };
}

// Opaque, in-memory local sessions. These are never Tide JWTs or production auth.
export function createDemoSessions(now = Date.now, lifetimeMs = 30 * 60 * 1000) {
  const sessions = new Map<string, { actor: Actor; expiresAt: number }>();
  return {
    issue(identity: unknown) {
      const actor = demoActor(identity);
      for (const [key, value] of sessions) if (value.expiresAt <= now()) sessions.delete(key);
      if (sessions.size >= 1000) throw new RuleError('Demo session capacity reached. Restart the local app.', 503);
      const token = `demo-${randomBytes(32).toString('hex')}`;
      const expiresAt = now() + lifetimeMs;
      sessions.set(token, { actor, expiresAt });
      return { token, actor: structuredClone(actor), expiresAt, simulated: true as const };
    },
    verify(token: string): Actor {
      const session = sessions.get(token);
      if (!session || session.expiresAt <= now()) { sessions.delete(token); throw new RuleError('Your simulated session ended. Sign in again to continue.', 401); }
      return structuredClone(session.actor);
    },
    revoke(token: string) { sessions.delete(token); },
  };
}
const globalDemo = globalThis as typeof globalThis & { milestoneDemoSessions?: ReturnType<typeof createDemoSessions> };
export function demoSessions() { return globalDemo.milestoneDemoSessions ??= createDemoSessions(); }

export function assertDemoRequest(request: Request) {
  if (!['localhost', '127.0.0.1', '[::1]'].includes(new URL(request.url).hostname)) throw new RuleError('Demo identities require a loopback URL.', 403);
}
