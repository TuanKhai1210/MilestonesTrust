import {test} from 'node:test';
import assert from 'node:assert/strict';
import {authenticate,authMode} from '../src/lib/auth';
test('Tide mode rejects forged demo identity headers without configured server',async()=>{
  const previous={...process.env};
  try {
    process.env.AUTH_MODE='tidecloak';process.env.TIDECLOAK_CONFIG_PATH='./config/does-not-exist.json';
    await assert.rejects(authenticate(new Request('http://localhost:3000/api/actions',{headers:{'x-demo-role':'sponsor'}})),/not configured/);
  }finally{process.env=previous;}
});
test('demo mode is explicit, loopback-only, and disabled in production',async()=>{
  const previous={...process.env};
  try {
    process.env.AUTH_MODE='demo';Object.assign(process.env,{NODE_ENV:'development'});
    const actor=await authenticate(new Request('http://localhost:3000/api/actions',{headers:{'x-demo-role':'sponsor'}}));
    assert.equal(actor.sub,'demo-sponsor');
    await assert.rejects(authenticate(new Request('https://example.com/api/actions',{headers:{'x-demo-role':'sponsor'}})),/loopback/);
    Object.assign(process.env,{NODE_ENV:'production'});assert.throws(()=>authMode(),/disabled/);
  }finally{process.env=previous;}
});
