// components/ApprovalCenter.tsx
'use client';

import React from 'react';
import {
  CheckCircle2,
  ShieldCheck,
  UserCheck,
  Banknote,
  Lock,
  Hash,
  FileCheck2,
  ShieldAlert,
  Fingerprint,
} from 'lucide-react';
import { AuthenticatedUser, CampaignState } from '../types/frontend';

interface ApprovalCenterProps {
  campaign: CampaignState;
  currentUser: AuthenticatedUser;
  onApproveRequest: (requestId: string, requestHash: string, role?: 'SPONSOR' | 'AUDITOR') => Promise<void>;
  allowDemoSwitch: boolean;
  onExecutePayment: (requestId: string) => Promise<void>;
  onVerifyEvidence: (milestoneId: string) => Promise<void>;
  onSwitchActorAndApprove: (
    actorKey: string,
    requestId: string,
    requestHash: string
  ) => Promise<void>;
  isSubmitting: boolean;
}

export default function ApprovalCenter({
  campaign,
  currentUser,
  onApproveRequest,
  onExecutePayment,
  onVerifyEvidence,
  onSwitchActorAndApprove,
  isSubmitting,
  allowDemoSwitch,
}: ApprovalCenterProps) {
  return (
    <div className="space-y-8 font-sans">
      {/* Header Banner */}
      <div className="bg-zinc-900 rounded-3xl border border-zinc-800 p-6 sm:p-8 shadow-2xl flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div className="space-y-2.5">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-3 py-1.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Multi-Party Consensus Vault
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-100 tracking-tight">
            Disbursement Approval Center
          </h2>
          <p className="text-sm text-zinc-400 max-w-2xl leading-relaxed">
            Cần hai chủ thể độc lập (<code className="font-mono text-emerald-300 bg-emerald-400/10 px-1.5 py-0.5 rounded">SPONSOR</code> + <code className="font-mono text-teal-300 bg-teal-400/10 px-1.5 py-0.5 rounded">AUDITOR</code>) phê duyệt cùng một <code className="font-mono text-zinc-300 bg-zinc-800 px-1.5 py-0.5 rounded">requestHash</code>. Phê duyệt được lưu trên server; không phải chữ ký mật mã riêng của người dùng.
          </p>
        </div>

        <div className="bg-black/50 backdrop-blur-xl rounded-2xl p-5 text-xs space-y-2 shrink-0 border border-zinc-800/80 shadow-inner min-w-[280px]">
          <div className="flex items-center gap-2 text-zinc-500 uppercase tracking-wider font-semibold text-[10px]">
            <Fingerprint className="w-4 h-4 text-emerald-500" />
            <span>Active Session Identity</span>
          </div>
          <div className="font-bold text-base text-zinc-100">
            {currentUser.displayName}
          </div>
          <div className="font-mono text-[11px] text-zinc-400 space-y-1">
            <div className="flex justify-between">
              <span className="text-zinc-600">sub:</span> 
              <span className="text-zinc-300 truncate ml-2">{currentUser.sub}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-600">roles:</span> 
              <span className="text-emerald-400">[{currentUser.roles.join(', ')}]</span>
            </div>
          </div>
        </div>
      </div>

      {/* Disbursement Requests List */}
      <div className="space-y-6">
        {campaign.requests.map((req) => {
          const milestone = campaign.milestones.find(
            (m) => m.id === req.milestoneId
          );
          const sponsorApproval = req.approvals.find(
            (a) => a.role === 'SPONSOR' && a.requestHash === req.requestHash
          );
          const auditorApproval = req.approvals.find(
            (a) => a.role === 'AUDITOR' && a.requestHash === req.requestHash
          );
          const approvalCount =
            Number(Boolean(sponsorApproval)) + Number(Boolean(auditorApproval));
          const isReadyToPay = approvalCount === 2 && req.status !== 'PAID';

          return (
            <div
              key={req.id}
              className="bg-zinc-900 rounded-3xl border border-zinc-800 shadow-xl overflow-hidden transition-all duration-200 hover:border-zinc-700"
            >
              {/* Vault Header Bar */}
              <div className="bg-zinc-950 px-6 py-4 flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800">
                <div className="flex items-center gap-4">
                  <span className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono text-xs font-bold tracking-wider">
                    REQ #{req.id} • v{req.version}
                  </span>
                  <span className="text-sm font-bold text-zinc-200">
                    {milestone?.title} <span className="text-zinc-500 font-normal">({req.milestoneId})</span>
                  </span>
                </div>

                <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-400 bg-black px-4 py-2 rounded-xl border border-zinc-800/80">
                  <Hash className="w-3.5 h-3.5 text-emerald-500" />
                  <span>hash: <span className="text-zinc-300">{req.requestHash}</span></span>
                </div>
              </div>

              {/* 3-Column Vault Body */}
              <div className="p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Column 1 (4 cols): Financial Summary */}
                <div className="lg:col-span-4 space-y-4 lg:border-r lg:border-zinc-800 lg:pr-8 flex flex-col justify-center">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                      Disbursement Amount
                    </span>
                    <p className="text-3xl sm:text-4xl font-extrabold text-white tabular-nums tracking-tight">
                      {req.amountVnd.toLocaleString()} <span className="text-emerald-500">₫</span>
                    </p>
                  </div>
                  
                  <div className="bg-black/40 p-4 rounded-2xl border border-zinc-800/60">
                    <p className="text-sm text-zinc-300 leading-relaxed">
                      <strong className="text-zinc-100 block mb-1 text-xs uppercase tracking-wider">Purpose</strong> 
                      {req.purpose}
                    </p>
                  </div>

                  <div className="text-[11px] text-zinc-500 space-y-1.5 pt-2 font-mono bg-zinc-950/50 p-4 rounded-2xl border border-zinc-800/40">
                    <div className="flex justify-between"><span className="text-zinc-600">Recipient:</span> <span className="text-zinc-300">{req.recipientId}</span></div>
                    <div className="flex justify-between"><span className="text-zinc-600">Creator sub:</span> <span className="text-zinc-300 truncate ml-4">{req.createdBySub}</span></div>
                    <div className="flex justify-between"><span className="text-zinc-600">Policy:</span> <span className="text-emerald-500/70">V{req.policyVersion}</span></div>
                  </div>
                </div>

                {/* Column 2 (5 cols): Dual-Role Signature Slots */}
                <div className="lg:col-span-5 space-y-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                      Quorum Progress
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${
                        approvalCount === 2
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      }`}
                    >
                      {approvalCount} / 2 Approvals
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${(approvalCount / 2) * 100}%` }}
                    />
                  </div>

                  <div className="space-y-3 pt-2">
                    {/* Slot 1: Sponsor */}
                    <div
                      className={`p-4 sm:p-5 rounded-2xl border transition-all duration-300 ${
                        sponsorApproval
                          ? 'bg-emerald-950/20 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.05)]'
                          : 'bg-zinc-950/50 border-zinc-800'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <div className={`p-2 rounded-lg ${sponsorApproval ? 'bg-emerald-500/20' : 'bg-zinc-800'}`}>
                            <UserCheck className={`w-4 h-4 ${sponsorApproval ? 'text-emerald-400' : 'text-zinc-500'}`} />
                          </div>
                          <span className={`text-xs font-bold tracking-wide ${sponsorApproval ? 'text-emerald-100' : 'text-zinc-300'}`}>
                            1. SPONSOR
                          </span>
                        </div>
                        <span
                          className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-lg border ${
                            sponsorApproval
                              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                              : 'bg-zinc-800 text-zinc-500 border-zinc-700'
                          }`}
                        >
                          {sponsorApproval ? 'Recorded' : 'Awaiting'}
                        </span>
                      </div>

                      {sponsorApproval ? (
                        <div className="text-[11px] text-zinc-400 font-mono mt-4 space-y-1.5 bg-black/40 p-3 rounded-xl border border-emerald-900/30">
                          <div className="flex justify-between"><span className="text-zinc-500">Approver:</span> <span className="text-zinc-200">{sponsorApproval.approverName}</span></div>
                          <div className="flex justify-between"><span className="text-zinc-500">Sub:</span> <span className="text-zinc-300">{sponsorApproval.approverSub}</span></div>
                        </div>
                      ) : (
                        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                          <span className="text-[11px] text-zinc-500">
                            Cần tài khoản quyền SPONSOR
                          </span>
                          <button
                            disabled={isSubmitting || !currentUser.roles.includes('SPONSOR') || req.status !== 'PENDING_APPROVAL'}
                            onClick={() => onApproveRequest(req.id, req.requestHash, 'SPONSOR')}
                            className="text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl transition-all shadow-lg shadow-emerald-900/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Duyệt (Sponsor)
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Slot 2: Independent Auditor */}
                    <div
                      className={`p-4 sm:p-5 rounded-2xl border transition-all duration-300 ${
                        auditorApproval
                          ? 'bg-teal-950/20 border-teal-500/30 shadow-[0_0_15px_rgba(20,184,166,0.05)]'
                          : 'bg-zinc-950/50 border-zinc-800'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <div className={`p-2 rounded-lg ${auditorApproval ? 'bg-teal-500/20' : 'bg-zinc-800'}`}>
                            <ShieldCheck className={`w-4 h-4 ${auditorApproval ? 'text-teal-400' : 'text-zinc-500'}`} />
                          </div>
                          <span className={`text-xs font-bold tracking-wide ${auditorApproval ? 'text-teal-100' : 'text-zinc-300'}`}>
                            2. AUDITOR
                          </span>
                        </div>
                        <span
                          className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-lg border ${
                            auditorApproval
                              ? 'bg-teal-500/20 text-teal-400 border-teal-500/30'
                              : 'bg-zinc-800 text-zinc-500 border-zinc-700'
                          }`}
                        >
                          {auditorApproval ? 'Recorded' : 'Awaiting'}
                        </span>
                      </div>

                      {auditorApproval ? (
                        <div className="text-[11px] text-zinc-400 font-mono mt-4 space-y-1.5 bg-black/40 p-3 rounded-xl border border-teal-900/30">
                          <div className="flex justify-between"><span className="text-zinc-500">Approver:</span> <span className="text-zinc-200">{auditorApproval.approverName}</span></div>
                          <div className="flex justify-between"><span className="text-zinc-500">Sub:</span> <span className="text-zinc-300">{auditorApproval.approverSub}</span></div>
                        </div>
                      ) : (
                        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                          <span className="text-[11px] text-zinc-500">
                            Cần tài khoản quyền AUDITOR
                          </span>
                          <button
                            disabled={isSubmitting || !currentUser.roles.includes('AUDITOR') || req.status !== 'PENDING_APPROVAL'}
                            onClick={() => onApproveRequest(req.id, req.requestHash, 'AUDITOR')}
                            className="text-xs font-bold bg-teal-600 hover:bg-teal-500 text-white px-4 py-2 rounded-xl transition-all shadow-lg shadow-teal-900/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Duyệt (Auditor)
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Column 3 (3 cols): Mock Payment & Verification Execution */}
                <div className="lg:col-span-3 flex flex-col justify-between bg-zinc-950 p-5 rounded-3xl border border-zinc-800 shadow-inner">
                  <div className="space-y-4">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-zinc-600 rounded-full" />
                      Settlement Gateway
                    </span>

                    {req.payment ? (
                      <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl space-y-2">
                        <div className="flex items-center gap-2 font-bold text-xs text-emerald-400">
                          <CheckCircle2 className="w-4 h-4 shrink-0" />
                          <span>MOCK PAYMENT SUCCESS</span>
                        </div>
                        <div className="bg-black/50 rounded-xl p-3 space-y-1 border border-emerald-900/30">
                          <p className="text-[10px] font-mono text-zinc-400 flex justify-between">
                            <span>Tx:</span> <span className="text-emerald-500/80">{req.payment.simulatedTransactionId.slice(0, 10)}...</span>
                          </p>
                          <p className="text-[10px] font-mono text-zinc-500 truncate">
                            Key: {req.payment.idempotencyKey}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-zinc-400 bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800/80 leading-relaxed min-h-[100px] flex items-center">
                        {isReadyToPay ? (
                          <span className="text-emerald-400 font-medium">
                            ✓ 2/2 Consensus Met! <br/><br/>Hệ thống đã mở khóa. Sẵn sàng giải ngân {req.amountVnd.toLocaleString()} ₫ qua cổng thanh toán mô phỏng.
                          </span>
                        ) : (
                          <span className="flex items-start gap-2.5 text-zinc-500">
                            <Lock className="w-4 h-4 text-zinc-600 shrink-0 mt-0.5" />
                            <span>
                              Cổng thanh toán bị khóa. Yêu cầu phê duyệt từ Sponsor và Auditor để mở khóa.
                            </span>
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="space-y-3 pt-6">
                    {milestone?.evidence && <div className="text-xs text-zinc-300 border border-zinc-700 rounded-xl p-3 space-y-2 break-words">
                      <strong className="block">Submitted evidence · {milestone.evidence.invoiceCode}</strong>
                      <p>{milestone.evidence.description}</p>
                      {milestone.evidence.fileUrl && <a className="underline text-teal-300" href={milestone.evidence.fileUrl} target="_blank" rel="noreferrer">Open evidence reference</a>}
                    </div>}
                    <button
                      disabled={isSubmitting || !currentUser.roles.includes('SPONSOR') || !isReadyToPay || Boolean(req.payment)}
                      onClick={() => onExecutePayment(req.id)}
                      className={`w-full py-3.5 px-4 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all duration-200 ${
                        isReadyToPay
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)] active:scale-95'
                          : req.payment
                          ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700'
                          : 'bg-zinc-900 text-zinc-600 cursor-not-allowed border border-zinc-800'
                      }`}
                    >
                      <Banknote className="w-4 h-4 shrink-0" />
                      <span>
                        {req.payment
                          ? 'Đã giải ngân'
                          : 'Thực thi lệnh chi (Mock)'}
                      </span>
                    </button>

                    {milestone && milestone.status === 'DISBURSED' && (
                      <button
                        disabled={isSubmitting || !currentUser.roles.includes('AUDITOR') || !milestone.evidence}
                        onClick={() => onVerifyEvidence(milestone.id)}
                        className="w-full py-3.5 px-4 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 bg-teal-600/20 hover:bg-teal-600/30 text-teal-400 border border-teal-500/30 transition-all active:scale-95"
                      >
                        <FileCheck2 className="w-4 h-4 shrink-0" />
                        <span>Xác thực & Mở khóa giai đoạn tiếp</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom Red-Team Abuse Simulator Strip */}
              {allowDemoSwitch && <div className="bg-rose-950/10 px-6 py-4 border-t border-rose-900/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2.5 text-xs font-bold text-rose-400/80 uppercase tracking-wider">
                  <ShieldAlert className="w-4 h-4 text-rose-500" />
                  <span>Local demo — server policy checks</span>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  <button
                    disabled={isSubmitting}
                    onClick={() => onSwitchActorAndApprove('admin_rogue', req.id, req.requestHash)}
                    className="text-[11px] bg-zinc-900 hover:bg-rose-950/40 text-rose-400/90 border border-rose-900/50 hover:border-rose-500/50 px-3.5 py-2 rounded-xl font-mono transition-colors"
                  >
                    [R8] Admin bypass
                  </button>
                  <button
                    disabled={isSubmitting}
                    onClick={() => onSwitchActorAndApprove('team_01', req.id, req.requestHash)}
                    className="text-[11px] bg-zinc-900 hover:bg-rose-950/40 text-rose-400/90 border border-rose-900/50 hover:border-rose-500/50 px-3.5 py-2 rounded-xl font-mono transition-colors"
                  >
                    [R4] Team self-approve
                  </button>
                  <button
                    disabled={isSubmitting}
                    onClick={() => onApproveRequest(req.id, '0xdeadbeef_tampered_hash')}
                    className="text-[11px] bg-zinc-900 hover:bg-rose-950/40 text-rose-400/90 border border-rose-900/50 hover:border-rose-500/50 px-3.5 py-2 rounded-xl font-mono transition-colors"
                  >
                    [R7] Hash tamper
                  </button>
                </div>
              </div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
