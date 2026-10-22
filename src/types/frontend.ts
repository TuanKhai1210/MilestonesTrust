// types/frontend.ts

export type BusinessRole =
  | 'SPONSOR'
  | 'PROJECT_TEAM'
  | 'AUDITOR'
  | 'PLATFORM_ADMIN';

export type MilestoneStatus =
  | 'LOCKED'
  | 'ELIGIBLE'
  | 'REQUESTED'
  | 'APPROVED'
  | 'DISBURSED'
  | 'VERIFIED';

export type RequestStatus =
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'PAID'
  | 'SUPERSEDED';

export interface AuthenticatedUser {
  key?: string;
  sub: string;
  username: string;
  displayName: string;
  roles: BusinessRole[];
  realmRoles?: string[];
  authSource: 'TIDECLOAK_JWT' | 'DEMO_SIMULATOR_ADAPTER' | 'PUBLIC_VIEW';
}

export interface Approval {
  id: string;
  requestId: string;
  approverSub: string;
  approverName: string;
  role: 'SPONSOR' | 'AUDITOR';
  decision: 'APPROVED' | 'REJECTED';
  requestHash: string;
  approvedAt: string;
}

export interface Payment {
  id: string;
  requestId: string;
  idempotencyKey: string;
  amountVnd: number;
  status: 'COMPLETED' | 'FAILED';
  simulatedTransactionId: string;
  paidAt: string;
}

export interface Evidence {
  id: string;
  milestoneId: string;
  submittedBySub: string;
  description: string;
  invoiceCode: string;
  fileUrl: string;
  verifiedBySub?: string;
  verifiedByName?: string;
  status: 'PENDING_VERIFICATION' | 'VERIFIED';
  submittedAt: string;
  verifiedAt?: string;
}

export interface DisbursementRequest {
  id: string;
  campaignId: string;
  milestoneId: string;
  version: number;
  amountVnd: number;
  recipientId: string;
  purpose: string;
  createdBySub: string;
  status: RequestStatus;
  policyVersion: number;
  requestHash: string;
  approvalsRequired: ('SPONSOR' | 'AUDITOR')[];
  approvals: Approval[];
  payment?: Payment;
  createdAt: string;
  updatedAt: string;
}

export interface Milestone {
  id: string;
  campaignId: string;
  sequence: number;
  title: string;
  description: string;
  unlockCondition: string;
  budgetVnd: number;
  status: MilestoneStatus;
  activeRequestId?: string;
  evidence?: Evidence;
}

export interface AuditEvent {
  id: string;
  campaignId: string;
  actorSub: string;
  actorName: string;
  actorRole: string;
  entityType:
    | 'CAMPAIGN'
    | 'MILESTONE'
    | 'REQUEST'
    | 'APPROVAL'
    | 'PAYMENT'
    | 'EVIDENCE'
    | 'QEA_GOVERNANCE';
  entityId: string;
  action: string;
  details: string;
  requestHash?: string;
  status: 'RECORDED' | 'BLOCKED_BY_POLICY' | 'PENDING_QEA_QUORUM';
  timestamp: string;
}

export interface QeaRoleChangeRequest {
  id: string;
  targetUserSub: string;
  targetUsername: string;
  requestedByAdminSub: string;
  requestedRole: BusinessRole;
  currentApprovals: number;
  requiredQuorum: number;
  totalRealmAdmins: number;
  status: 'PENDING_QUORUM' | 'REJECTED';
  createdAt: string;
}

export interface CampaignState {
  id: string;
  title: string;
  subtitle: string;
  totalBudgetVnd: number;
  releasedBudgetVnd: number;
  ownerSub: string;
  policyVersion: number;
  status: 'ACTIVE' | 'COMPLETED';
  milestones: Milestone[];
  requests: DisbursementRequest[];
  auditEvents: AuditEvent[];
  qeaPendingRequests: QeaRoleChangeRequest[];
}
