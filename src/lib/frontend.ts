import type { createStore } from './domain';
import type { AuthenticatedUser, BusinessRole, CampaignState, MilestoneStatus } from '../types/frontend';

export type Snapshot = ReturnType<ReturnType<typeof createStore>['snapshot']>;
export type ServerActor = { sub: string; name: string; roles: string[] };
const privateIdentity = 'Not publicly disclosed';
const roleMap: Record<string, BusinessRole> = { mt_team: 'PROJECT_TEAM', mt_sponsor: 'SPONSOR', mt_auditor: 'AUDITOR', mt_admin: 'PLATFORM_ADMIN' };
export const demoPeople: AuthenticatedUser[] = [
  ['team_01', 'team', 'Project team', 'PROJECT_TEAM'],
  ['sponsor_01', 'sponsor', 'Sponsor', 'SPONSOR'],
  ['auditor_01', 'auditor', 'Independent auditor', 'AUDITOR'],
  ['admin_rogue', 'admin', 'Platform admin', 'PLATFORM_ADMIN'],
].map(([key, username, name, role]) => ({ key, sub: `demo-${username}`, username, displayName: `${name} (simulated)`, roles: [role as BusinessRole], authSource: 'DEMO_SIMULATOR_ADAPTER' }));

export function displayActor(actor: ServerActor | null, demo: boolean): AuthenticatedUser {
  if (!actor) return { sub: '', username: '', displayName: 'Public visitor', roles: [], authSource: 'PUBLIC_VIEW' };
  return { sub: actor.sub, username: actor.name, displayName: actor.name, realmRoles: actor.roles,
    roles: actor.roles.includes('mt_member') ? actor.roles.flatMap(role => roleMap[role] ? [roleMap[role]] : []) : [],
    authSource: demo ? 'DEMO_SIMULATOR_ADAPTER' : 'TIDECLOAK_JWT' };
}

export function safeReference(value: unknown): string {
  if (typeof value !== 'string') return '';
  try { const url = new URL(value); return ['http:', 'https:'].includes(url.protocol) ? url.href : ''; } catch { return ''; }
}

export function campaignView(state: Snapshot): CampaignState {
  const campaignId = state.campaign.id;
  return {
    id: campaignId, title: state.campaign.title, subtitle: 'A synthetic relief campaign, funded one verified milestone at a time.',
    totalBudgetVnd: state.campaign.budget, releasedBudgetVnd: state.payments.reduce((sum, p) => sum + Number(p.amount), 0),
    ownerSub: privateIdentity, policyVersion: 1, status: state.milestones.every(m => m.status === 'VERIFIED') ? 'COMPLETED' : 'ACTIVE',
    milestones: state.milestones.map(m => {
      let note: {description: string; invoiceCode?: string; fileUrl?: string} | undefined;
      if (m.evidence) {
        try { const parsed = JSON.parse(String(m.evidence)); if (parsed && typeof parsed.description === 'string') note = parsed; } catch { /* Legacy evidence is a plain text note. */ }
        note ??= { description: String(m.evidence) };
      }
      return { id: String(m.id), campaignId, sequence: Number(m.seq), title: String(m.title),
        description: 'Synthetic project milestone.', unlockCondition: Number(m.seq) === 1 ? 'Team requests this allocation.' : 'Previous milestone must be verified by the auditor.',
        budgetVnd: Number(m.amount), status: String(m.status) as MilestoneStatus,
        activeRequestId: state.requests.find(r => r.milestone_id === m.id)?.id as string | undefined,
        evidence: note ? { id: `${m.id}/evidence`, milestoneId: String(m.id), submittedBySub: privateIdentity,
          description: note.description, invoiceCode: typeof note.invoiceCode === 'string' ? note.invoiceCode : '', fileUrl: safeReference(note.fileUrl),
          status: m.status === 'VERIFIED' ? 'VERIFIED' : 'PENDING_VERIFICATION', submittedAt: '' } : undefined };
    }),
    requests: state.requests.map(r => {
      const payment = state.payments.find(p => p.request_id === r.id);
      return { id: String(r.id), campaignId, milestoneId: String(r.milestone_id), version: Number(r.version), amountVnd: Number(r.amount),
        recipientId: String(r.recipient), purpose: String(r.purpose), createdBySub: privateIdentity,
        status: r.status === 'PAID' ? 'PAID' : r.status === 'APPROVED' ? 'APPROVED' : 'PENDING_APPROVAL', policyVersion: 1,
        requestHash: String(r.hash), approvalsRequired: ['SPONSOR', 'AUDITOR'],
        approvals: state.approvals.filter(a => a.request_id === r.id).map(a => ({ id: `${r.id}/${a.role}`, requestId: String(r.id),
          approverSub: privateIdentity, approverName: `${a.role === 'mt_sponsor' ? 'Sponsor' : 'Auditor'} (server-recorded)`,
          role: a.role === 'mt_sponsor' ? 'SPONSOR' : 'AUDITOR', decision: 'APPROVED', requestHash: String(a.request_hash), approvedAt: '' })),
        payment: payment ? { id: String(payment.id), requestId: String(r.id), idempotencyKey: String(r.id), amountVnd: Number(payment.amount),
          status: 'COMPLETED', simulatedTransactionId: String(payment.id), paidAt: String(payment.created_at) } : undefined,
        createdAt: '', updatedAt: '' };
    }),
    auditEvents: state.audit.map(a => ({ id: String(a.id), campaignId, actorSub: privateIdentity, actorName: 'Application record', actorRole: 'SERVER',
      entityType: 'CAMPAIGN', entityId: campaignId, action: String(a.event), details: String(a.detail), status: 'RECORDED', timestamp: String(a.created_at) })),
    qeaPendingRequests: [],
  };
}

export async function backendJson<T>(response: Response): Promise<T> {
  let result;
  try { result = await response.json(); } catch { throw new Error(`Backend returned HTTP ${response.status} without JSON. No local fallback was applied.`); }
  if (!response.ok) throw new Error(typeof result?.error === 'string' ? result.error : `Backend returned HTTP ${response.status}.`);
  return result as T;
}
