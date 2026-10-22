import {test} from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPairSync, sign, type KeyObject} from 'node:crypto';
import {mkdtempSync, writeFileSync, unlinkSync, rmdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {authenticate, authInfo} from '../src/lib/auth';

test('signed JWT fixtures exercise the real verifier without a live Tide realm', async t => {
  const previous = {...process.env};
  const directory = mkdtempSync(path.join(tmpdir(), 'milestonetrust-jwt-'));
  const filename = path.join(directory, 'public-fixture.json');
  const {privateKey, publicKey} = generateKeyPairSync('ec', {namedCurve:'prime256v1'});
  const config = {
    realm:'unit-test', 'auth-server-url':'https://identity.fixture.invalid',
    resource:'milestone-trust-test', 'public-client':true,
    jwk:{keys:[{...publicKey.export({format:'jwk'}),kid:'fixture-key',alg:'ES256',use:'sig'}]},
  };
  writeFileSync(filename, JSON.stringify(config));
  process.env.AUTH_MODE = 'tidecloak';
  process.env.TIDECLOAK_CONFIG_PATH = filename;
  t.after(() => {
    try { unlinkSync(filename); rmdirSync(directory); }
    finally { process.env = previous; }
  });

  function token(overrides:Record<string,unknown> = {}, key:KeyObject = privateKey) {
    const now = Math.floor(Date.now()/1000);
    const header = Buffer.from(JSON.stringify({alg:'ES256',kid:'fixture-key',typ:'JWT'})).toString('base64url');
    const body = Buffer.from(JSON.stringify({
      iss:'https://identity.fixture.invalid/realms/unit-test', azp:config.resource,
      sub:'fixture-sponsor', preferred_username:'Synthetic sponsor', iat:now, exp:now+300,
      realm_access:{roles:['mt_member','unknown-role']},
      resource_access:{[config.resource]:{roles:['mt_sponsor','mt_member']}},
      ...overrides,
    })).toString('base64url');
    const input = `${header}.${body}`;
    return `${input}.${sign('sha256',Buffer.from(input),{key,dsaEncoding:'ieee-p1363'}).toString('base64url')}`;
  }
  function request(value:string, extra:Record<string,string> = {}) {
    return new Request('http://localhost:3000/api/state',{headers:{Authorization:`Bearer ${value}`,...extra}});
  }
  async function unauthorized(value:string) {
    await assert.rejects(authenticate(request(value)), error => (error as {status?:number}).status === 401);
  }

  await t.test('accepts a trusted signature and takes only recognized signed roles', async () => {
    const actor = await authenticate(request(token(), {'x-demo-role':'admin'}));
    assert.equal(actor.sub,'fixture-sponsor');
    assert.deepEqual(actor.roles,['mt_member','mt_sponsor']);
  });
  await t.test('rejects altered content even if it claims an administrator role', async () => {
    const parts = token().split('.');
    parts[1] = Buffer.from(JSON.stringify({...JSON.parse(Buffer.from(parts[1],'base64url').toString()),realm_access:{roles:['mt_admin']}})).toString('base64url');
    await unauthorized(parts.join('.'));
  });
  await t.test('rejects an untrusted signing key', async () => {
    await unauthorized(token({}, generateKeyPairSync('ec',{namedCurve:'prime256v1'}).privateKey));
  });
  await t.test('rejects expired and not-yet-valid tokens', async () => {
    await unauthorized(token({exp:Math.floor(Date.now()/1000)-60}));
    await unauthorized(token({nbf:Math.floor(Date.now()/1000)+60}));
  });
  await t.test('rejects another issuer and another client', async () => {
    await unauthorized(token({iss:'https://other.fixture.invalid/realms/unit-test'}));
    await unauthorized(token({azp:'another-client'}));
  });
  await t.test('rejects missing or malformed subjects', async () => {
    for (const sub of [undefined,123,'   ']) await unauthorized(token({sub}));
  });
  await t.test('rejects malformed role lists with 401', async () => {
    await unauthorized(token({realm_access:{roles:'mt_admin'}}));
    await unauthorized(token({resource_access:{[config.resource]:{roles:[123]}}}));
  });
  await t.test('does not use a demo header when no bearer token is supplied', async () => {
    await assert.rejects(authenticate(new Request('http://localhost:3000/api/state',{headers:{'x-demo-role':'sponsor'}})), error => (error as {status?:number}).status === 401);
  });
  await t.test('exposes only the public login settings and rejects a client secret', () => {
    const info = authInfo();
    assert.equal(info.mode,'tidecloak');
    assert.equal(info.configured,true);
    assert.deepEqual(Object.keys(info.clientConfig!).sort(),['auth-server-url','public-client','realm','resource','ssl-required'].sort());
    writeFileSync(filename, JSON.stringify({...config,credentials:{secret:'synthetic-test-only'}}));
    assert.throws(() => authInfo(), /without a secret/);
  });
});
