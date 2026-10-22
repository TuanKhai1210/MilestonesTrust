import { DatabaseSync } from 'node:sqlite';
import { createHash, randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

export type Role = 'mt_member' | 'mt_team' | 'mt_sponsor' | 'mt_auditor' | 'mt_admin';
export type Actor = { sub: string; name: string; roles: Role[] };
export class RuleError extends Error {
  constructor(message: string, public status = 409) { super(message); }
}
type Row = Record<string, string | number | null>;
export function requestHash(row: Row) {
  return createHash('sha256').update(JSON.stringify([
    'CWF-001', row.milestone_id, row.amount, row.recipient,
    row.purpose, row.version, row.policy_version,
  ])).digest('hex');
}
export function createStore(filename = ':memory:') {
  if (filename !== ':memory:') mkdirSync(path.dirname(filename), { recursive: true });
  const db = new DatabaseSync(filename);
  db.exec(`PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;
    CREATE TABLE IF NOT EXISTS milestones(id TEXT PRIMARY KEY, seq INTEGER UNIQUE, title TEXT, amount INTEGER, status TEXT, evidence TEXT);
    CREATE TABLE IF NOT EXISTS requests(id TEXT PRIMARY KEY, milestone_id TEXT UNIQUE REFERENCES milestones(id), creator TEXT, amount INTEGER, recipient TEXT, purpose TEXT, version INTEGER, policy_version INTEGER, hash TEXT, status TEXT);
    CREATE TABLE IF NOT EXISTS approvals(request_id TEXT REFERENCES requests(id), actor TEXT, role TEXT, request_hash TEXT, PRIMARY KEY(request_id, role), UNIQUE(request_id, actor));
    CREATE TABLE IF NOT EXISTS payments(id TEXT PRIMARY KEY, request_id TEXT UNIQUE REFERENCES requests(id), amount INTEGER, created_at TEXT);
    CREATE TABLE IF NOT EXISTS audit(id INTEGER PRIMARY KEY AUTOINCREMENT, event TEXT, detail TEXT, created_at TEXT);
  `);
  const seeds = [
    ['M1', 1, 'Pilot deployment', 20000000, 'ELIGIBLE'],
    ['M2', 2, 'Community expansion', 30000000, 'LOCKED'],
    ['M3', 3, 'Final installation', 50000000, 'LOCKED'],
  ];
  for (const seed of seeds) db.prepare('INSERT OR IGNORE INTO milestones(id,seq,title,amount,status) VALUES(?,?,?,?,?)').run(...seed);
  function event(name: string, detail: string) {
    db.prepare('INSERT INTO audit(event,detail,created_at) VALUES(?,?,?)').run(name, detail, new Date().toISOString());
  }
  function get(table: 'requests' | 'milestones', id: unknown): Row {
    if (typeof id !== 'string') throw new RuleError('Missing record ID.', 400);
    const row = db.prepare(`SELECT * FROM ${table} WHERE id=?`).get(id) as Row | undefined;
    if (!row) throw new RuleError('Record not found.', 404);
    return row;
  }
  function requireRole(actor: Actor, role: Role) {
    if (!actor.roles.includes('mt_member') || !actor.roles.includes(role)) throw new RuleError(`This action requires ${role.replace('mt_', '')} access to this campaign.`, 403);
  }
  function text(input: unknown, label: string, max = 500) {
    if (typeof input !== 'string' || !input.trim() || input.trim().length > max) throw new RuleError(`${label} must contain 1–${max} characters.`, 400);
    return input.trim();
  }
  function intact(request: Row) {
    if (request.hash !== requestHash(request)) throw new RuleError('Request changed. Create a new version and collect fresh approvals.');
  }
  function snapshot() {
    const milestones = db.prepare('SELECT * FROM milestones ORDER BY seq').all();
    const requests = db.prepare('SELECT id,milestone_id,amount,recipient,purpose,version,hash,status FROM requests').all();
    const approvals = db.prepare('SELECT request_id,role,request_hash FROM approvals').all();
    const payments = db.prepare('SELECT * FROM payments ORDER BY created_at').all();
    const audit = db.prepare('SELECT * FROM audit ORDER BY id DESC LIMIT 30').all();
    return { campaign: { id: 'CWF-001', title: 'Clean water for flood communities', budget: 100000000 }, milestones, requests, approvals, payments, audit };
  }
  function act(actor: Actor, body: Record<string, unknown>) {
    if (!actor.sub) throw new RuleError('Sign in first.', 401);
    db.exec('BEGIN IMMEDIATE');
    try {
      const action = body.action;
      if (action === 'request' || action === 'edit') {
        requireRole(actor, 'mt_team');
        const milestone = get('milestones', body.milestoneId);
        const existing = db.prepare('SELECT * FROM requests WHERE milestone_id=?').get(milestone.id) as Row | undefined;
        if (action === 'request' && (milestone.status !== 'ELIGIBLE' || existing)) throw new RuleError('This milestone is not open for a new funding request.');
        if (action === 'edit' && (!existing || existing.creator !== actor.sub || existing.status === 'PAID')) throw new RuleError('Only the requester can edit an unpaid request.', 403);
        const amount = body.amount;
        if (!Number.isSafeInteger(amount) || amount !== milestone.amount) throw new RuleError('The MVP releases exactly the milestone allocation.', 400);
        const request: Row = {
          id: existing?.id ?? randomUUID(), milestone_id: milestone.id,
          creator: actor.sub, amount: amount as number,
          recipient: text(body.recipient, 'Recipient', 100), purpose: text(body.purpose, 'Purpose'),
          version: Number(existing?.version ?? 0) + 1, policy_version: 1, status: 'PENDING',
        };
        request.hash = requestHash(request);
        if (existing) {
          db.prepare('DELETE FROM approvals WHERE request_id=?').run(existing.id);
          db.prepare('UPDATE requests SET amount=?,recipient=?,purpose=?,version=?,hash=?,status=? WHERE id=?').run(request.amount, request.recipient, request.purpose, request.version, request.hash, 'PENDING', request.id);
        } else {
          db.prepare('INSERT INTO requests(id,milestone_id,creator,amount,recipient,purpose,version,policy_version,hash,status) VALUES(?,?,?,?,?,?,?,?,?,?)').run(request.id, request.milestone_id, request.creator, request.amount, request.recipient, request.purpose, request.version, request.policy_version, request.hash, request.status);
        }
        db.prepare('UPDATE milestones SET status=? WHERE id=?').run('REQUESTED', milestone.id);
        event(existing ? 'Request revised' : 'Funding requested', `${milestone.id}: version ${request.version}. Approvals bind to this request hash.`);
      } else if (action === 'approve') {
        if (body.role !== 'mt_sponsor' && body.role !== 'mt_auditor') throw new RuleError('Choose a valid approval role.', 400);
        requireRole(actor, body.role);
        const request = get('requests', body.requestId);
        intact(request);
        if (request.status !== 'PENDING') throw new RuleError('Request is not awaiting approval.');
        if (request.creator === actor.sub) throw new RuleError('The requester cannot approve their own request.', 403);
        if (body.requestHash !== request.hash) throw new RuleError('You reviewed an older request. Refresh and review again.');
        const used = db.prepare('SELECT * FROM approvals WHERE request_id=? AND (actor=? OR role=?)').get(request.id, actor.sub, body.role);
        if (used) throw new RuleError('Each role and each person can count only once.');
        db.prepare('INSERT INTO approvals VALUES(?,?,?,?)').run(request.id, actor.sub, body.role, request.hash);
        const count = db.prepare('SELECT COUNT(*) AS n FROM approvals WHERE request_id=? AND request_hash=?').get(request.id, request.hash) as { n: number };
        if (count.n === 2) {
          db.prepare('UPDATE requests SET status=? WHERE id=?').run('APPROVED', request.id);
          db.prepare('UPDATE milestones SET status=? WHERE id=?').run('APPROVED', request.milestone_id);
        }
        event('Approval recorded', `${body.role.replace('mt_', '')} approved ${request.milestone_id} version ${request.version}.`);
      } else if (action === 'pay') {
        requireRole(actor, 'mt_sponsor');
        const request = get('requests', body.requestId);
        intact(request);
        const paid = db.prepare('SELECT id FROM payments WHERE request_id=?').get(request.id);
        if (paid) { db.exec('COMMIT'); return snapshot(); }
        const approvals = db.prepare('SELECT actor,role FROM approvals WHERE request_id=? AND request_hash=?').all(request.id, request.hash) as Row[];
        if (request.status !== 'APPROVED' || approvals.length !== 2 || new Set(approvals.map(a => a.actor)).size !== 2 || !approvals.some(a => a.role === 'mt_sponsor') || !approvals.some(a => a.role === 'mt_auditor')) throw new RuleError('Both independent approvals are required before release.');
        db.prepare('INSERT INTO payments VALUES(?,?,?,?)').run(`SIM-${randomUUID().slice(0,8)}`, request.id, request.amount, new Date().toISOString());
        db.prepare('UPDATE requests SET status=? WHERE id=?').run('PAID', request.id);
        db.prepare('UPDATE milestones SET status=? WHERE id=?').run('DISBURSED', request.milestone_id);
        event('Simulated payment released', `${request.milestone_id}: ${Number(request.amount).toLocaleString('en-US')} VND. No real funds moved.`);
      } else if (action === 'evidence') {
        requireRole(actor, 'mt_team');
        const milestone = get('milestones', body.milestoneId);
        if (milestone.status !== 'DISBURSED') throw new RuleError('Evidence follows a disbursed milestone.');
        db.prepare('UPDATE milestones SET evidence=? WHERE id=?').run(text(body.evidence, 'Evidence', 2000), milestone.id);
        event('Evidence submitted', `${milestone.id}: synthetic delivery evidence is ready for review.`);
      } else if (action === 'verify') {
        requireRole(actor, 'mt_auditor');
        const milestone = get('milestones', body.milestoneId);
        if (milestone.status !== 'DISBURSED' || !milestone.evidence) throw new RuleError('Submit evidence before verification.');
        const request = db.prepare('SELECT creator FROM requests WHERE milestone_id=?').get(milestone.id) as Row;
        if (request.creator === actor.sub) throw new RuleError('The requester cannot verify their own milestone.', 403);
        db.prepare('UPDATE milestones SET status=? WHERE id=?').run('VERIFIED', milestone.id);
        db.prepare('UPDATE milestones SET status=? WHERE seq=? AND status=?').run('ELIGIBLE', Number(milestone.seq)+1, 'LOCKED');
        event('Milestone verified', `${milestone.id} verified by the auditor. The next milestone may request funding; it is not paid automatically.`);
      } else throw new RuleError('Unknown action.', 400);
      db.exec('COMMIT');
      return snapshot();
    } catch (error) { db.exec('ROLLBACK'); throw error; }
  }
  return { db, snapshot, act, close: () => db.close() };
}
export type Snapshot = ReturnType<ReturnType<typeof createStore>['snapshot']>;
let cached: ReturnType<typeof createStore> | undefined;
export function store() { return cached ??= createStore(process.env.DATABASE_PATH || './data/milestone-trust.sqlite'); }
