'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { CheckCircle2, AlertOctagon, X } from 'lucide-react';

// --- SỬA TOÀN BỘ BLOCK NÀY: DÙNG ../ THAY VÌ @/ ---
import Navbar from '../components/Navbar';
import PublicDashboard from '../components/PublicDashboard';
import ProjectWorkspace from '../components/ProjectWorkspace';
import ApprovalCenter from '../components/ApprovalCenter';
import SecurityGovernance from '../components/SecurityGovernance';
import AuditTrail from '../components/AuditTrail';
import { AuthenticatedUser, CampaignState } from '../types/frontend';
// ---------------------------------------------------
const FALLBACK_IDENTITIES: AuthenticatedUser[] = [
  {
    key: 'team_01',
    sub: 'tc-sub-team-4410-vn',
    username: 'team_cleanwater',
    displayName: 'Lan Nguyen (Project Team Lead)',
    roles: ['PROJECT_TEAM'],
    authSource: 'DEMO_SIMULATOR_ADAPTER',
  },
  {
    key: 'sponsor_01',
    sub: 'tc-sub-sponsor-8821-vn',
    username: 'sponsor_greenfund',
    displayName: 'Minh Tran (Sponsor - Green Relief Fund)',
    roles: ['SPONSOR'],
    authSource: 'DEMO_SIMULATOR_ADAPTER',
  },
  {
    key: 'auditor_01',
    sub: 'tc-sub-auditor-9903-vn',
    username: 'auditor_independent',
    displayName: 'Kiet Le (Independent Field Auditor)',
    roles: ['AUDITOR'],
    authSource: 'DEMO_SIMULATOR_ADAPTER',
  },
  {
    key: 'admin_rogue',
    sub: 'tc-sub-admin-0001-vn',
    username: 'sysadmin_rogue',
    displayName: 'Hung Pham (Platform Admin #1)',
    roles: ['PLATFORM_ADMIN'],
    authSource: 'DEMO_SIMULATOR_ADAPTER',
  },
];

function createFallbackCampaign(): CampaignState {
  const initialHash = '0x8f4a9c21d7e05b3a11c9e402';
  return {
    id: 'CWF-001',
    title: 'Clean Water for Flood Communities',
    subtitle: 'Nước sạch cho vùng lũ — Quản lý quỹ tài trợ minh bạch theo từng giai đoạn',
    totalBudgetVnd: 100000000,
    releasedBudgetVnd: 0,
    ownerSub: 'tc-sub-sponsor-8821-vn',
    policyVersion: 1,
    status: 'ACTIVE',
    milestones: [
      {
        id: 'M1',
        campaignId: 'CWF-001',
        sequence: 1,
        title: '1. Pilot Deployment',
        description: 'Mua sắm và lắp đặt thử nghiệm 40 bộ lọc nước gốm tại xã vùng rốn lũ.',
        unlockCondition: 'Duyệt kế hoạch mua thiết bị; sau giải ngân phải nộp hóa đơn và minh chứng bàn giao.',
        budgetVnd: 20000000,
        status: 'REQUESTED',
        activeRequestId: 'REQ-001',
      },
      {
        id: 'M2',
        campaignId: 'CWF-001',
        sequence: 2,
        title: '2. Community Expansion',
        description: 'Mở rộng lắp đặt 80 bộ lọc nước và trạm cấp nước cộng đồng tại 3 thôn tiếp theo.',
        unlockCondition: 'Giai đoạn 1 đã được Auditor xác minh (VERIFIED); yêu cầu mới phải được 2 bên phê duyệt.',
        budgetVnd: 30000000,
        status: 'LOCKED',
      },
      {
        id: 'M3',
        campaignId: 'CWF-001',
        sequence: 3,
        title: '3. Final Installation',
        description: 'Hoàn thiện hệ thống lọc tổng cho trường học xã và bàn giao quy trình bảo trì.',
        unlockCondition: 'Giai đoạn 2 hoàn thành và được xác minh; tiếp tục duyệt chi theo quy trình.',
        budgetVnd: 50000000,
        status: 'LOCKED',
      },
    ],
    requests: [
      {
        id: 'REQ-001',
        campaignId: 'CWF-001',
        milestoneId: 'M1',
        version: 1,
        amountVnd: 20000000,
        recipientId: 'SUPPLIER-VIETWATER-01',
        purpose: 'Purchase 40 ceramic pilot water filtration units for Quang Binh commune',
        createdBySub: 'tc-sub-team-4410-vn',
        status: 'PENDING_APPROVAL',
        policyVersion: 1,
        requestHash: initialHash,
        approvalsRequired: ['SPONSOR', 'AUDITOR'],
        approvals: [],
        createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
        updatedAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
      },
    ],
    qeaPendingRequests: [
      {
        id: 'QEA-ESC-01',
        targetUserSub: 'tc-sub-admin-alt-99',
        targetUsername: 'hung_shadow_account',
        requestedByAdminSub: 'tc-sub-admin-0001-vn',
        requestedRole: 'SPONSOR',
        currentApprovals: 1,
        requiredQuorum: 2,
        totalRealmAdmins: 3,
        status: 'PENDING_QUORUM',
        createdAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
      },
    ],
    auditEvents: [
      {
        id: 'AUD-001',
        campaignId: 'CWF-001',
        actorSub: 'tc-sub-sponsor-8821-vn',
        actorName: 'Minh Tran (Sponsor)',
        actorRole: 'SPONSOR',
        entityType: 'CAMPAIGN',
        entityId: 'CWF-001',
        action: 'CAMPAIGN_CREATED',
        details: 'Committed 100,000,000 VND across 3 sequential milestones (20M / 30M / 50M) under policy MILESTONE_TRUST_V1.',
        status: 'RECORDED',
        timestamp: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
      },
      {
        id: 'AUD-002',
        campaignId: 'CWF-001',
        actorSub: 'tc-sub-team-4410-vn',
        actorName: 'Lan Nguyen (Project Team)',
        actorRole: 'PROJECT_TEAM',
        entityType: 'REQUEST',
        entityId: 'REQ-001',
        action: 'DISBURSEMENT_REQUESTED',
        details: 'Requested 20,000,000 VND for M1 (Pilot Deployment). Waiting for independent SPONSOR + AUDITOR approvals.',
        requestHash: initialHash,
        status: 'RECORDED',
        timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
      },
    ],
  };
}

export default function MilestoneTrustApp() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedActorKey, setSelectedActorKey] = useState<string>('team_01');
  const [campaign, setCampaign] = useState<CampaignState>(createFallbackCampaign);
  const [availableIdentities, setAvailableIdentities] =
    useState<AuthenticatedUser[]>(FALLBACK_IDENTITIES);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [bannerFeedback, setBannerFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const currentUser =
    availableIdentities.find((i) => i.key === selectedActorKey) ||
    FALLBACK_IDENTITIES[0];

  // Try syncing with backend API if teammate has /api/campaign running
  const fetchStateFromApi = useCallback(async (actorKey: string) => {
    try {
      const res = await fetch('/api/campaign', {
        headers: { 'x-demo-actor-id': actorKey },
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data.campaign) setCampaign(data.campaign);
      if (data.availableDemoIdentities) {
        setAvailableIdentities(data.availableDemoIdentities);
      }
    } catch {
      // Runs smoothly in pure Frontend UI mode if /api is not mounted yet
    }
  }, []);

  useEffect(() => {
    fetchStateFromApi(selectedActorKey);
  }, [selectedActorKey, fetchStateFromApi]);

  const handleResetDemo = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/campaign', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setCampaign(data.campaign);
        setBannerFeedback({ type: 'success', message: data.message });
        return;
      }
    } catch {
      // Fallback UI reset
    } finally {
      setIsSubmitting(false);
    }
    setCampaign(createFallbackCampaign());
    setBannerFeedback({
      type: 'success',
      message: 'Demo state reset to initial Campaign #CWF-001 (100,000,000 ₫).',
    });
  };

  const handleCreateOrUpdateRequest = async (payload: {
    milestoneId: string;
    amountVnd: number;
    recipientId: string;
    purpose: string;
  }) => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-demo-actor-id': selectedActorKey,
        },
        body: JSON.stringify(payload),
      });
      if (res.ok || res.status === 403) {
        const data = await res.json();
        if (data.campaign) setCampaign(data.campaign);
        setBannerFeedback({
          type: data.ok ? 'success' : 'error',
          message: data.message,
        });
        return;
      }
    } catch {
      // Pure Frontend interactive fallback
    } finally {
      setIsSubmitting(false);
    }

    // Pure Frontend Fallback Logic for R2, R3, R7
    const targetMilestone = campaign.milestones.find(
      (m) => m.id === payload.milestoneId
    );
    if (!targetMilestone || targetMilestone.status === 'LOCKED') {
      setBannerFeedback({
        type: 'error',
        message: `Policy R2 Violation: Milestone ${payload.milestoneId} is LOCKED. Previous milestone completion evidence must be verified first.`,
      });
      return;
    }
    if (payload.amountVnd <= 0 || payload.amountVnd > targetMilestone.budgetVnd) {
      setBannerFeedback({
        type: 'error',
        message: `Policy R3 Violation: Requested amount exceeds Milestone ${targetMilestone.id} cap (${targetMilestone.budgetVnd.toLocaleString()} ₫).`,
      });
      return;
    }

    const newHash =
      '0x' +
      Math.abs(
        payload.amountVnd * 31 + payload.purpose.length * 17 + Date.now()
      )
        .toString(16)
        .padEnd(24, 'a')
        .slice(0, 24);

    setCampaign((prev) => {
      const next = structuredClone(prev);
      const existing = next.requests.find(
        (r) => r.milestoneId === payload.milestoneId
      );
      if (existing) {
        const oldApprovals = existing.approvals.length;
        existing.version += 1;
        existing.amountVnd = payload.amountVnd;
        existing.recipientId = payload.recipientId;
        existing.purpose = payload.purpose;
        existing.requestHash = newHash;
        existing.approvals = [];
        existing.status = 'PENDING_APPROVAL';
        setBannerFeedback({
          type: 'success',
          message: `Policy R7 Triggered: Request updated to v${existing.version} with new hash ${newHash}. ${oldApprovals} prior approval(s) were invalidated!`,
        });
      }
      return next;
    });
  };

  const handleApproveRequest = async (
    requestId: string,
    requestHash: string,
    overrideActorKey?: string
  ) => {
    const actorKey = overrideActorKey || selectedActorKey;
    if (overrideActorKey) setSelectedActorKey(overrideActorKey);

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/requests/${requestId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-demo-actor-id': actorKey,
        },
        body: JSON.stringify({ requestHash }),
      });
      if (res.ok || res.status === 403) {
        const data = await res.json();
        if (data.campaign) setCampaign(data.campaign);
        setBannerFeedback({
          type: data.ok ? 'success' : 'error',
          message: data.message,
        });
        return;
      }
    } catch {
      // Pure Frontend interactive fallback
    } finally {
      setIsSubmitting(false);
    }

    const actor =
      availableIdentities.find((i) => i.key === actorKey) || currentUser;

    if (actor.roles.includes('PLATFORM_ADMIN')) {
      setBannerFeedback({
        type: 'error',
        message:
          'Policy R8 Violation: Platform Admin cannot approve disbursements using admin role alone.',
      });
      return;
    }
    if (actor.roles.includes('PROJECT_TEAM')) {
      setBannerFeedback({
        type: 'error',
        message:
          'Policy R4 Violation: The Project Team cannot self-approve its own disbursement request.',
      });
      return;
    }

    const role = actor.roles.includes('SPONSOR') ? 'SPONSOR' : 'AUDITOR';

    setCampaign((prev) => {
      const next = structuredClone(prev);
      const req = next.requests.find((r) => r.id === requestId);
      if (!req) return prev;
      if (requestHash !== req.requestHash) {
        setBannerFeedback({
          type: 'error',
          message:
            'Policy R7 Violation: Request hash mismatch! Payload was modified after approval.',
        });
        return prev;
      }
      if (!req.approvals.some((a) => a.role === role)) {
        req.approvals.push({
          id: `APP-${role}`,
          requestId: req.id,
          approverSub: actor.sub,
          approverName: actor.displayName,
          role,
          decision: 'APPROVED',
          requestHash: req.requestHash,
          approvedAt: new Date().toISOString(),
        });
      }
      if (req.approvals.length === 2) {
        req.status = 'APPROVED';
      }
      setBannerFeedback({
        type: 'success',
        message: `${role} approval recorded (${req.approvals.length}/2 quorum).`,
      });
      return next;
    });
  };

  const handleExecutePayment = async (requestId: string) => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/requests/${requestId}/pay`, {
        method: 'POST',
        headers: { 'x-demo-actor-id': selectedActorKey },
      });
      if (res.ok || res.status === 403) {
        const data = await res.json();
        if (data.campaign) setCampaign(data.campaign);
        setBannerFeedback({
          type: data.ok ? 'success' : 'error',
          message: data.message,
        });
        return;
      }
    } catch {
      // Fallback
    } finally {
      setIsSubmitting(false);
    }

    setCampaign((prev) => {
      const next = structuredClone(prev);
      const req = next.requests.find((r) => r.id === requestId);
      if (!req) return prev;
      if (req.payment) {
        setBannerFeedback({
          type: 'error',
          message: `Policy R9 Violation: Request ${req.id} was already paid. Duplicate payment blocked by idempotency key.`,
        });
        return prev;
      }
      if (req.approvals.length < 2) {
        setBannerFeedback({
          type: 'error',
          message:
            'Policy R5 Violation: Both SPONSOR and AUDITOR approvals are required before payment.',
        });
        return prev;
      }
      req.payment = {
        id: `PAY-${req.id}`,
        requestId: req.id,
        idempotencyKey: `IDEMP-${req.id}-v${req.version}`,
        amountVnd: req.amountVnd,
        status: 'COMPLETED',
        simulatedTransactionId: `MOCK-TX-${Date.now().toString().slice(-6)}`,
        paidAt: new Date().toISOString(),
      };
      req.status = 'PAID';
      next.releasedBudgetVnd += req.amountVnd;
      const m = next.milestones.find((item) => item.id === req.milestoneId);
      if (m) m.status = 'DISBURSED';
      setBannerFeedback({
        type: 'success',
        message: `Mock Payment Completed! ${req.amountVnd.toLocaleString()} ₫ released.`,
      });
      return next;
    });
  };

  const handleSubmitEvidence = async (
    milestoneId: string,
    payload: { description: string; invoiceCode: string; fileUrl: string }
  ) => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/milestones/${milestoneId}/evidence`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-demo-actor-id': selectedActorKey,
        },
        body: JSON.stringify(payload),
      });
      if (res.ok || res.status === 403) {
        const data = await res.json();
        if (data.campaign) setCampaign(data.campaign);
        setBannerFeedback({
          type: data.ok ? 'success' : 'error',
          message: data.message,
        });
        return;
      }
    } catch {
      // Fallback
    } finally {
      setIsSubmitting(false);
    }

    setCampaign((prev) => {
      const next = structuredClone(prev);
      const m = next.milestones.find((item) => item.id === milestoneId);
      if (!m || m.status !== 'DISBURSED') {
        setBannerFeedback({
          type: 'error',
          message: `Milestone ${milestoneId} must be DISBURSED before uploading completion evidence.`,
        });
        return prev;
      }
      m.evidence = {
        id: `EVID-${milestoneId}`,
        milestoneId,
        submittedBySub: currentUser.sub,
        description: payload.description,
        invoiceCode: payload.invoiceCode,
        fileUrl: payload.fileUrl,
        status: 'PENDING_VERIFICATION',
        submittedAt: new Date().toISOString(),
      };
      setBannerFeedback({
        type: 'success',
        message: `Completion evidence uploaded for ${milestoneId}. Ready for Auditor verification!`,
      });
      return next;
    });
  };

  const handleVerifyEvidence = async (milestoneId: string) => {
    setSelectedActorKey('auditor_01');
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/milestones/${milestoneId}/verify`, {
        method: 'POST',
        headers: { 'x-demo-actor-id': 'auditor_01' },
      });
      if (res.ok || res.status === 403) {
        const data = await res.json();
        if (data.campaign) setCampaign(data.campaign);
        setBannerFeedback({
          type: data.ok ? 'success' : 'error',
          message: data.message,
        });
        return;
      }
    } catch {
      // Fallback
    } finally {
      setIsSubmitting(false);
    }

    setCampaign((prev) => {
      const next = structuredClone(prev);
      const m = next.milestones.find((item) => item.id === milestoneId);
      if (!m || !m.evidence) {
        setBannerFeedback({
          type: 'error',
          message:
            'Please upload completion evidence in Project Workspace before verifying!',
        });
        return prev;
      }
      m.status = 'VERIFIED';
      m.evidence.status = 'VERIFIED';
      const nextM = next.milestones.find(
        (item) => item.sequence === m.sequence + 1
      );
      if (nextM && nextM.status === 'LOCKED') {
        nextM.status = 'ELIGIBLE';
      }
      setBannerFeedback({
        type: 'success',
        message: `Policy R10 Executed: ${milestoneId} VERIFIED! Next stage ${nextM?.id} is now UNLOCKED (ELIGIBLE).`,
      });
      return next;
    });
  };

  const activeRequest = campaign.requests[0];
  const pendingApprovalsCount = activeRequest ? activeRequest.approvals.length : 0;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        selectedActorKey={selectedActorKey}
        onSelectActor={setSelectedActorKey}
        availableIdentities={availableIdentities}
        onResetDemo={handleResetDemo}
        pendingApprovalsCount={pendingApprovalsCount}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Live Toast / Policy Feedback Alert */}
        {bannerFeedback && (
          <div
            role="status"
            className={`rounded-2xl p-4 border flex items-start justify-between gap-3 shadow-sm transition-all ${
              bannerFeedback.type === 'success'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                : 'bg-rose-50 border-rose-300 text-rose-950'
            }`}
          >
            <div className="flex items-start gap-2.5 text-xs sm:text-sm font-bold">
              {bannerFeedback.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertOctagon className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              )}
              <span>{bannerFeedback.message}</span>
            </div>
            <button
              onClick={() => setBannerFeedback(null)}
              className="text-slate-400 hover:text-slate-700"
              aria-label="Close alert"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {activeTab === 'dashboard' && (
          <PublicDashboard campaign={campaign} onNavigate={setActiveTab} />
        )}

        {activeTab === 'workspace' && (
          <ProjectWorkspace
            campaign={campaign}
            currentUser={currentUser}
            onCreateOrUpdateRequest={handleCreateOrUpdateRequest}
            onSubmitEvidence={handleSubmitEvidence}
            isSubmitting={isSubmitting}
          />
        )}

        {activeTab === 'approvals' && (
          <ApprovalCenter
            campaign={campaign}
            currentUser={currentUser}
            onApproveRequest={(id, hash) => handleApproveRequest(id, hash)}
            onExecutePayment={handleExecutePayment}
            onVerifyEvidence={handleVerifyEvidence}
            onSwitchActorAndApprove={(actorKey, id, hash) =>
              handleApproveRequest(id, hash, actorKey)
            }
            isSubmitting={isSubmitting}
          />
        )}

        {activeTab === 'security' && (
          <SecurityGovernance campaign={campaign} currentUser={currentUser} />
        )}

        {activeTab === 'audit' && <AuditTrail events={campaign.auditEvents} />}
      </main>

      <footer className="bg-white border-t border-slate-200/80 py-5 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <div>
            <strong className="text-slate-800">MilestoneTrust MVP</strong> — RMIT
            Hackathon 2026 Challenge 2 (Tide UNLOCKED)
          </div>
          <div>
            Synthetic Hackathon Dataset (#CWF-001 • 100,000,000 ₫) • Protected by
            TideCloak OIDC & QEA
          </div>
        </div>
      </footer>
    </div>
  );
}