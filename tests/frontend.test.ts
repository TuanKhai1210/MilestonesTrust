import { test } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createStore, type Actor } from '../src/lib/domain';
import { backendJson, campaignView, demoPeople, displayActor, safeReference } from '../src/lib/frontend';
import Navbar from '../src/components/Navbar';
import ApprovalCenter from '../src/components/ApprovalCenter';

const team: Actor = { sub: 'team', name: 'Team', roles: ['mt_member', 'mt_team'] };
const sponsor: Actor = { sub: 'sponsor', name: 'Sponsor', roles: ['mt_member', 'mt_sponsor'] };
const auditor: Actor = { sub: 'auditor', name: 'Auditor', roles: ['mt_member', 'mt_auditor'] };

test('frontend reads actual persisted revisions, approvals, payment and evidence without inventing QEA or identities', () => {
  const s = createStore();
  try {
    let view = campaignView(s.snapshot());
    assert.equal(view.requests.length, 0);
    assert.equal(view.releasedBudgetVnd, 0);
    assert.equal(view.milestones[0].status, 'ELIGIBLE');
    const draft = { action: 'request', milestoneId: 'M1', amount: 20000000, recipient: 'Supplier A', purpose: 'Water filters' };
    s.act(team, draft);
    let r = s.snapshot().requests[0];
    s.act(sponsor, { action: 'approve', requestId: r.id, requestHash: r.hash, role: 'mt_sponsor' });
    s.act(team, { ...draft, action: 'edit', purpose: 'Revised water filters' });
    view = campaignView(s.snapshot());
    assert.equal(view.requests[0].version, 2);
    assert.notEqual(view.requests[0].requestHash, r.hash);
    assert.equal(view.requests[0].approvals.length, 0);
    r = s.snapshot().requests[0];
    for (const [actor, role] of [[sponsor, 'mt_sponsor'], [auditor, 'mt_auditor']] as const) s.act(actor, { action: 'approve', requestId: r.id, requestHash: r.hash, role });
    s.act(sponsor, { action: 'pay', requestId: r.id });
    s.act(team, { action: 'evidence', milestoneId: 'M1', evidence: JSON.stringify({ description: 'Synthetic invoice', invoiceCode: 'DEMO-1', fileUrl: 'javascript:alert(1)' }) });
    s.act(auditor, { action: 'verify', milestoneId: 'M1' });
    view = campaignView(s.snapshot());
    assert.equal(view.releasedBudgetVnd, 20000000);
    assert.equal(view.requests[0].requestHash, r.hash);
    assert.equal(view.requests[0].status, 'PAID');
    assert.deepEqual(view.requests[0].approvals.map(a => a.role).sort(), ['AUDITOR', 'SPONSOR']);
    assert.ok(view.requests[0].approvals.every(a => a.requestHash === r.hash && a.approverSub === 'Not publicly disclosed'));
    assert.equal(view.requests[0].payment?.id, s.snapshot().payments[0].id);
    assert.equal(view.milestones[0].evidence?.description, 'Synthetic invoice');
    assert.equal(view.milestones[0].evidence?.fileUrl, '');
    assert.equal(view.milestones[0].status, 'VERIFIED');
    assert.equal(view.milestones[1].status, 'ELIGIBLE');
    assert.deepEqual(view.qeaPendingRequests, []);
    assert.equal(view.auditEvents.length, s.snapshot().audit.length);
  } finally { s.close(); }
});

test('failed or missing backend responses stay failures instead of simulated success', async () => {
  await assert.rejects(backendJson(new Response('not found', { status: 404 })), /HTTP 404.*No local fallback/);
  await assert.rejects(backendJson(Response.json({ error: 'Forbidden' }, { status: 403 })), /Forbidden/);
  await assert.rejects(backendJson(Response.json({}, { status: 500 })), /HTTP 500/);
  assert.deepEqual(await backendJson(Response.json({ recorded: true })), { recorded: true });
});

test('public visitor and non-members cannot gain displayed campaign roles', () => {
  assert.equal(displayActor(null, false).authSource, 'PUBLIC_VIEW');
  assert.deepEqual(displayActor(null, true).roles, []);
  assert.deepEqual(displayActor({ ...sponsor, roles: ['mt_sponsor'] }, false).roles, []);
  assert.deepEqual(displayActor(sponsor, false).roles, ['SPONSOR']);
  assert.equal(displayActor(sponsor, false).authSource, 'TIDECLOAK_JWT');
  assert.equal(displayActor(team, true).authSource, 'DEMO_SIMULATOR_ADAPTER');
  assert.equal(safeReference('data:text/html,<script>'), '');
  assert.equal(safeReference('https://example.org/proof'), 'https://example.org/proof');
});

test('live UI does not expose demo account switching or abuse simulation', () => {
  const currentUser = displayActor(null, false);
  const navbar = (mode: 'demo' | 'tidecloak') => renderToStaticMarkup(React.createElement(Navbar, { activeTab: 'dashboard', setActiveTab() {}, currentUser, selectedActorKey: 'team_01', onSelectActor() {}, availableIdentities: demoPeople, onResetDemo() {}, pendingApprovalsCount: 0, authMode: mode, authConfigured: true }));
  assert.doesNotMatch(navbar('tidecloak'), /<select|Reset Demo/);
  assert.match(navbar('tidecloak'), /Sign in with TideCloak/);
  assert.match(navbar('demo'), /aria-label="Demo identity"/);
  const s = createStore();
  try {
    s.act(team, { action: 'request', milestoneId: 'M1', amount: 20000000, recipient: 'Supplier', purpose: 'Filters' });
    const html = renderToStaticMarkup(React.createElement(ApprovalCenter, { campaign: campaignView(s.snapshot()), currentUser, allowDemoSwitch: false, isSubmitting: false, onApproveRequest: async () => {}, onExecutePayment: async () => {}, onVerifyEvidence: async () => {}, onSwitchActorAndApprove: async () => {} }));
    assert.doesNotMatch(html, /Admin bypass|Team self-approve|Hash tamper/);
    assert.equal((html.match(/<button disabled=""/g) || []).length, 3);
  } finally { s.close(); }
});
