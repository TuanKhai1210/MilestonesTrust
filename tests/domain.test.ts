import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createStore, type Actor } from '../src/lib/domain';
const team:Actor={sub:'team',name:'Team',roles:['mt_member','mt_team']};
const sponsor:Actor={sub:'sponsor',name:'Sponsor',roles:['mt_member','mt_sponsor']};
const auditor:Actor={sub:'auditor',name:'Auditor',roles:['mt_member','mt_auditor']};
const admin:Actor={sub:'admin',name:'Admin',roles:['mt_member','mt_admin']};
function create(s:ReturnType<typeof createStore>) {
  s.act(team,{action:'request',milestoneId:'M1',amount:20000000,recipient:'Supplier A',purpose:'Water filters'});
  return s.snapshot().requests[0];
}
function approve(s:ReturnType<typeof createStore>, actor:Actor, role:string) {
  const r=s.snapshot().requests[0];
  return s.act(actor,{action:'approve',requestId:r.id,requestHash:r.hash,role});
}
test('complete milestone flow requires two people, pays once, and does not auto-pay next milestone',()=>{
  const s=createStore();try {
    const r=create(s);
    approve(s,sponsor,'mt_sponsor');
    assert.throws(()=>s.act(sponsor,{action:'pay',requestId:r.id}),/Both independent/);
    approve(s,auditor,'mt_auditor');
    s.act(sponsor,{action:'pay',requestId:r.id});s.act(sponsor,{action:'pay',requestId:r.id});
    assert.equal(s.snapshot().payments.length,1);
    assert.equal(s.snapshot().milestones[1].status,'LOCKED');
    assert.throws(()=>s.act(auditor,{action:'verify',milestoneId:'M1'}),/Submit evidence/);
    s.act(team,{action:'evidence',milestoneId:'M1',evidence:'Synthetic invoice and delivery confirmation'});
    s.act(auditor,{action:'verify',milestoneId:'M1'});
    assert.equal(s.snapshot().milestones[1].status,'ELIGIBLE');
    assert.equal(s.snapshot().payments.length,1);
  }finally{s.close();}
});
test('admin, non-members and requester cannot approve or pay',()=>{
  const s=createStore();try {
    const r=create(s);
    assert.throws(()=>approve(s,admin,'mt_sponsor'),/requires sponsor/);
    assert.throws(()=>s.act(admin,{action:'pay',requestId:r.id}),/requires sponsor/);
    assert.throws(()=>approve(s,{...sponsor,roles:['mt_sponsor']},'mt_sponsor'),/requires sponsor/);
    assert.throws(()=>approve(s,{...team,roles:['mt_member','mt_team','mt_sponsor']},'mt_sponsor'),/requester cannot approve/);
  }finally{s.close();}
});
test('same person cannot provide both approvals or count duplicate role',()=>{
  const s=createStore();try {
    create(s);const both:Actor={...sponsor,roles:['mt_member','mt_sponsor','mt_auditor']};
    approve(s,both,'mt_sponsor');
    assert.throws(()=>approve(s,both,'mt_auditor'),/only once/);
    assert.throws(()=>approve(s,{...sponsor,sub:'another-sponsor'},'mt_sponsor'),/only once/);
    assert.equal(s.snapshot().approvals.length,1);
  }finally{s.close();}
});
test('editing recipient clears approvals and rejects stale approval hash',()=>{
  const s=createStore();try {
    const before=create(s);approve(s,sponsor,'mt_sponsor');approve(s,auditor,'mt_auditor');
    s.act(team,{action:'edit',milestoneId:'M1',amount:20000000,recipient:'Supplier B',purpose:'Water filters'});
    const after=s.snapshot().requests[0];
    assert.equal(after.version,2);assert.notEqual(after.hash,before.hash);assert.equal(s.snapshot().approvals.length,0);
    assert.throws(()=>s.act(auditor,{action:'approve',requestId:after.id,requestHash:before.hash,role:'mt_auditor'}),/older request/);
    assert.throws(()=>s.act(sponsor,{action:'pay',requestId:after.id}),/Both independent/);
  }finally{s.close();}
});
test('locked, oversized and non-integer funding requests are rejected atomically',()=>{
  const s=createStore();try {
    assert.throws(()=>s.act(team,{action:'request',milestoneId:'M2',amount:30000000,recipient:'A',purpose:'B'}),/not open/);
    for(const amount of [20000001,1.5,-1,'20000000']) assert.throws(()=>s.act(team,{action:'request',milestoneId:'M1',amount,recipient:'A',purpose:'B'}),/exactly/);
    assert.equal(s.snapshot().requests.length,0);assert.equal(s.snapshot().audit.length,0);
  }finally{s.close();}
});
test('request hash detects edits under the trusted backend model',()=>{
  const s=createStore();try {
    create(s);s.db.prepare('UPDATE requests SET amount=1').run();
    assert.throws(()=>approve(s,sponsor,'mt_sponsor'),/Request changed/);
    assert.equal(s.snapshot().approvals.length,0);
  }finally{s.close();}
});
test('repeated executions of the same request create exactly one payment',()=>{
  const s=createStore();try {
    const r=create(s);approve(s,sponsor,'mt_sponsor');approve(s,auditor,'mt_auditor');
    const results=Array.from({length:10},()=>s.act(sponsor,{action:'pay',requestId:r.id}));
    assert.equal(results.at(-1)!.payments.length,1);
    assert.equal(s.db.prepare('SELECT COUNT(*) AS n FROM payments').get()!.n,1);
  }finally{s.close();}
});
