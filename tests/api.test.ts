import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync, unlinkSync, rmdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {POST} from '../src/app/api/actions/route';
import {GET} from '../src/app/api/state/route';
import {store} from '../src/lib/domain';

test('API rejects invalid writes and completes all three synthetic milestones', async t => {
  const previous = {...process.env};
  const directory = mkdtempSync(path.join(tmpdir(),'milestonetrust-api-'));
  process.env.AUTH_MODE = 'demo';
  process.env.DATABASE_PATH = path.join(directory,'campaign.sqlite');
  process.env.APP_ORIGIN = 'http://localhost:3000';
  Object.assign(process.env,{NODE_ENV:'development'});
  t.after(() => {
    try {
      store().close();
      for (const file of ['campaign.sqlite','campaign.sqlite-wal','campaign.sqlite-shm']) {
        try { unlinkSync(path.join(directory,file)); }
        catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error; }
      }
      rmdirSync(directory);
    } finally { process.env = previous; }
  });
  async function action(role:string, body:unknown, status = 200, headers:Record<string,string> = {}) {
    const response = await POST(new Request('http://localhost:3000/api/actions', {
      method:'POST', headers:{'Content-Type':'application/json','x-demo-role':role,...headers}, body:JSON.stringify(body),
    }));
    const result = await response.json();
    assert.equal(response.status,status, JSON.stringify({body,error:result.error}));
    assert.equal(response.headers.get('cache-control'), status === 200 ? 'no-store' : null);
    return result;
  }
  await action('team',{action:'request'},403,{Origin:'https://other.fixture.invalid'});
  await action('team',{action:'request'},415,{'Content-Type':'text/plain'});
  await action('',{action:'request'},401);
  await action('team',[],400);
  await action('team',{padding:'x'.repeat(10001)},413);
  const invalidJson = await POST(new Request('http://localhost:3000/api/actions',{method:'POST',headers:{'Content-Type':'application/json','x-demo-role':'team'},body:'{'}));
  assert.equal(invalidJson.status,400);
  await action('admin',{action:'request',milestoneId:'M1',amount:20000000,recipient:'Supplier A',purpose:'Synthetic filters'},403);

  let snapshot;
  for (const [index, amount] of [20000000,30000000,50000000].entries()) {
    const milestoneId = `M${index+1}`;
    snapshot = await action('team',{action:'request',milestoneId,amount,recipient:'Synthetic supplier A',purpose:'Synthetic water equipment'});
    let request = snapshot.requests.find((r:{milestone_id:string}) => r.milestone_id === milestoneId);
    await action('sponsor',{action:'approve',requestId:request.id,requestHash:request.hash,role:'mt_sponsor'});
    await action('sponsor',{action:'pay',requestId:request.id},409);
    await action('admin',{action:'approve',requestId:request.id,requestHash:request.hash,role:'mt_auditor'},403);
    await action('auditor',{action:'approve',requestId:request.id,requestHash:request.hash,role:'mt_auditor'});
    if (index === 0) {
      const oldHash = request.hash;
      snapshot = await action('team',{action:'edit',milestoneId,amount,recipient:'Synthetic supplier B',purpose:'Revised synthetic equipment'});
      request = snapshot.requests.find((r:{milestone_id:string}) => r.milestone_id === milestoneId);
      assert.equal(snapshot.approvals.length,0);
      await action('auditor',{action:'approve',requestId:request.id,requestHash:oldHash,role:'mt_auditor'},409);
      await action('sponsor',{action:'pay',requestId:request.id},409);
      await action('sponsor',{action:'approve',requestId:request.id,requestHash:request.hash,role:'mt_sponsor'});
      await action('auditor',{action:'approve',requestId:request.id,requestHash:request.hash,role:'mt_auditor'});
    }
    snapshot = await action('sponsor',{action:'pay',requestId:request.id});
    assert.equal(snapshot.payments.length,index+1);
    const auditCount = snapshot.audit.length;
    snapshot = await action('sponsor',{action:'pay',requestId:request.id});
    assert.equal(snapshot.payments.length,index+1);
    assert.equal(snapshot.audit.length,auditCount);
    await action('team',{action:'edit',milestoneId,amount,recipient:'Another supplier',purpose:'Too late'},403);
    await action('auditor',{action:'verify',milestoneId},409);
    await action('team',{action:'evidence',milestoneId,evidence:'Synthetic delivery confirmed for API testing only.'});
    await action('admin',{action:'verify',milestoneId},403);
    snapshot = await action('auditor',{action:'verify',milestoneId});
    assert.equal(snapshot.milestones[index].status,'VERIFIED');
    if (index < 2) assert.equal(snapshot.milestones[index+1].status,'ELIGIBLE');
    assert.equal(snapshot.payments.length,index+1);
  }
  assert.equal(snapshot.payments.reduce((total:number,payment:{amount:number})=>total+payment.amount,0),100000000);
  const publicResponse = await GET(new Request('http://localhost:3000/api/state'));
  assert.equal(publicResponse.status,200);
  const publicState = await publicResponse.json();
  assert.equal(publicState.actor,null);
  assert.equal(publicState.milestones.length,3);
  assert.ok(publicState.milestones.every((m:{status:string})=>m.status==='VERIFIED'));
  assert.ok(publicState.requests.every((r:Record<string,unknown>)=>!('creator' in r)));
});
