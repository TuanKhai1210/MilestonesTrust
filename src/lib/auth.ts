import fs from 'node:fs';
import { verifyTideCloakToken } from '@tidecloak/nextjs/server';
import { RuleError, type Actor, type Role } from './domain';

export const ROLES: Role[] = ['mt_member','mt_team','mt_sponsor','mt_auditor','mt_admin'];
export function authMode() {
  const mode = process.env.AUTH_MODE || 'tidecloak';
  if (mode !== 'tidecloak' && mode !== 'demo') throw new RuleError('Invalid AUTH_MODE.', 503);
  if (mode === 'demo' && process.env.NODE_ENV === 'production') throw new RuleError('Demo identities are disabled in production.', 503);
  return mode;
}
export function adapter() {
  const filename = process.env.TIDECLOAK_CONFIG_PATH || './config/tidecloak.json';
  if (!fs.existsSync(/* turbopackIgnore: true */ filename)) return null;
  const config = JSON.parse(fs.readFileSync(/* turbopackIgnore: true */ filename, 'utf8'));
  if (!config.realm || !config['auth-server-url'] || !config.resource || config.credentials?.secret) throw new RuleError('Export a public TideCloak client adapter without a secret.', 503);
  return config;
}
export function authInfo() {
  const mode = authMode();
  const config = mode === 'tidecloak' ? adapter() : null;
  // Client receives only public OIDC settings. The verification keychain stays server-side.
  const clientConfig = config ? { realm: config.realm, resource: config.resource, 'auth-server-url': config['auth-server-url'], 'ssl-required': config['ssl-required'] || 'external', 'public-client': true } : null;
  return { mode, configured: Boolean(config), clientConfig, consoleUrl: config ? `${config['auth-server-url'].replace(/\/$/,'')}/realms/${encodeURIComponent(config.realm)}/tide-console/` : null };
}
export async function authenticate(request: Request): Promise<Actor> {
  if (authMode() === 'demo') {
    if (!['localhost','127.0.0.1','[::1]'].includes(new URL(request.url).hostname)) throw new RuleError('Demo identities require a loopback URL.', 403);
    const key = request.headers.get('x-demo-role');
    if (!['team','sponsor','auditor','admin'].includes(key || '')) throw new RuleError('Choose a demo identity.', 401);
    return { sub: `demo-${key}`, name: `Demo ${key}`, roles: ['mt_member', `mt_${key}` as Role] };
  }
  const config = adapter();
  if (!config) throw new RuleError('TideCloak is not configured. Follow docs/TIDECLOAK_SETUP.md.', 503);
  const token = request.headers.get('authorization')?.match(/^Bearer (.+)$/)?.[1];
  if (!token) throw new RuleError('Sign in with TideCloak first.', 401);
  let payload;
  try { payload = await verifyTideCloakToken(config, token, []); }
  catch { throw new RuleError('Token verification failed.', 401); }
  if (!payload || typeof payload.sub !== 'string' || !payload.sub.trim()) throw new RuleError('Invalid or expired TideCloak token.', 401);
  const claims = payload as Record<string, any>;
  const issuer = `${config['auth-server-url'].replace(/\/$/, '')}/realms/${config.realm}`;
  if (claims.iss !== issuer || claims.azp !== config.resource) throw new RuleError('Token was not issued for this realm and application.', 401);
  function tokenRoles(value: unknown): Role[] {
    if (value === undefined) return [];
    if (!Array.isArray(value) || value.some(role => typeof role !== 'string')) throw new RuleError('Invalid role claims.', 401);
    return value.filter((role): role is Role => ROLES.includes(role as Role));
  }
  const roles = [...new Set([...tokenRoles(claims.realm_access?.roles), ...tokenRoles(claims.resource_access?.[config.resource]?.roles)])];
  return { sub: claims.sub, name: typeof claims.preferred_username === 'string' ? claims.preferred_username : 'Participant', roles };
}
