// components/ProjectWorkspace.tsx
'use client';

import React, { useState, useMemo } from 'react';
import {
  Send,
  FileUp,
  AlertTriangle,
  Hash,
  Lock,
  CheckCircle2,
  Edit3,
  Sparkles,
  FileText,
} from 'lucide-react';
import { AuthenticatedUser, CampaignState /* ... */ } from '../types/frontend';
interface ProjectWorkspaceProps {
  campaign: CampaignState;
  currentUser: AuthenticatedUser;
  onCreateOrUpdateRequest: (payload: {
    milestoneId: string;
    amountVnd: number;
    recipientId: string;
    purpose: string;
  }) => Promise<void>;
  onSubmitEvidence: (
    milestoneId: string,
    payload: { description: string; invoiceCode: string; fileUrl: string }
  ) => Promise<void>;
  isSubmitting: boolean;
}

export default function ProjectWorkspace({
  campaign,
  currentUser,
  onCreateOrUpdateRequest,
  onSubmitEvidence,
  isSubmitting,
}: ProjectWorkspaceProps) {
  const [selectedMilestoneId, setSelectedMilestoneId] = useState('M1');
  const [amountVnd, setAmountVnd] = useState(20000000);
  const [recipientId, setRecipientId] = useState('SUPPLIER-VIETWATER-01');
  const [purpose, setPurpose] = useState(
    'Purchase 40 ceramic pilot water filtration units for Quang Binh commune'
  );

  const [evidenceMilestoneId, setEvidenceMilestoneId] = useState('M1');
  const [invoiceCode, setInvoiceCode] = useState('INV-2026-QB-040');
  const [evidenceDesc, setEvidenceDesc] = useState(
    'Synthetic demo: 40 ceramic water filtration units delivered and installed; review the prepared delivery note.'
  );
  const [fileUrl, setFileUrl] = useState(
    ''
  );

  const isTeam = currentUser.roles.includes('PROJECT_TEAM');

  // Visual deterministic preview of the canonical string for UI transparency (Policy R7)
  const canonicalPreview = useMemo(() => {
    const version = (campaign.requests.find(r => r.milestoneId === selectedMilestoneId)?.version || 0) + 1;
    return JSON.stringify([campaign.id, selectedMilestoneId, amountVnd, recipientId.trim(), purpose.trim(), version, campaign.policyVersion]);
  }, [campaign.id, campaign.policyVersion, campaign.requests, selectedMilestoneId, amountVnd, recipientId, purpose]);

  const handleSelectMilestone = (id: string) => {
    setSelectedMilestoneId(id);
    const m = campaign.milestones.find((item) => item.id === id);
    if (m) {
      setAmountVnd(m.budgetVnd);
      if (id === 'M2') {
        setPurpose('Expand community water stations to 3 neighbouring villages (80 units)');
      } else if (id === 'M3') {
        setPurpose('Final school filtration system installation and maintenance training');
      } else {
        setPurpose('Purchase 40 ceramic pilot water filtration units for Quang Binh commune');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Role Status Banner */}
      {!isTeam ? (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 shadow-sm">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm text-amber-950">
            <strong>Role Notice:</strong> You are currently viewing as{' '}
            <span className="font-mono font-bold">
              {currentUser.displayName} [{currentUser.roles.join(', ')}]
            </span>
            . Only the <strong>PROJECT_TEAM</strong> role can create funding requests or
            upload evidence. You can still click the buttons below to demonstrate server-side
            policy rejection!
          </div>
        </div>
      ) : (
        <div className="bg-sky-50 border border-sky-200 rounded-2xl p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-xs sm:text-sm text-sky-950">
            <Sparkles className="w-5 h-5 text-sky-600 shrink-0" />
            <span>
              Authenticated as <strong>{currentUser.displayName}</strong> (
              <code className="font-mono">PROJECT_TEAM</code>). You can submit funding
              requests for unlocked milestones and upload completion proofs.
            </span>
          </div>
        </div>
      )}

      {/* Quick Milestone Selector Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {campaign.milestones.map((m) => {
          const isSelected = m.id === selectedMilestoneId;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => handleSelectMilestone(m.id)}
              className={`text-left p-4 rounded-2xl border transition-all ${
                isSelected
                  ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                  : 'bg-white text-slate-900 border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span
                  className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                    isSelected
                      ? 'bg-emerald-500 text-slate-950'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {m.id}
                </span>
                <span
                  className={`text-[11px] font-bold uppercase ${
                    isSelected ? 'text-emerald-300' : 'text-slate-500'
                  }`}
                >
                  {m.status}
                </span>
              </div>
              <p className="text-sm font-bold truncate">{m.title}</p>
              <p
                className={`text-lg font-extrabold tabular-nums mt-1 ${
                  isSelected ? 'text-white' : 'text-slate-900'
                }`}
              >
                {m.budgetVnd.toLocaleString()} ₫
              </p>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Card: Request Funding & R7 Hash Tamper Tester */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-5">
          <div className="border-b border-slate-100 pb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
              Module 1 • Request Funding
            </span>
            <h2 className="text-lg font-extrabold text-slate-900 mt-2.5">
              Create or Edit Milestone Disbursement Request
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Protected by Policy <strong>R2</strong> (Unlocked stage only),{' '}
              <strong>R3</strong> (Budget cap), and <strong>R7</strong> (Canonical{' '}
              <code className="font-mono">requestHash</code> invalidates prior approvals on edit).
            </p>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Requested Amount (VND)
                </label>
                <input
                  type="number"
                  value={amountVnd}
                  onChange={(e) => setAmountVnd(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-bold text-slate-900 tabular-nums focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Recipient / Supplier Code
                </label>
                <input
                  type="text"
                  maxLength={100}
                  value={recipientId}
                  onChange={(e) => setRecipientId(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Disbursement Purpose & Procurement Plan
              </label>
              <textarea
                rows={3}
                maxLength={500}
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Canonical Payload Preview Box */}
            <div className="bg-slate-900 text-slate-200 rounded-2xl p-4 space-y-2 border border-slate-800">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5" />
                  Canonical Payload Binding (Policy R7)
                </span>
                <span className="text-[11px] font-mono text-slate-400">SHA-256 Input</span>
              </div>
              <p className="text-[11px] font-mono text-slate-300 break-all bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                {canonicalPreview}
              </p>

              {/* Quick Demo Presets for R7 & R2 */}
              <div className="pt-1 flex flex-wrap items-center gap-2">
                <span className="text-[11px] text-slate-400">Quick Demo Presets:</span>
                <button
                  type="button"
                  onClick={() => setAmountVnd(2000000)}
                  className="text-[11px] font-semibold bg-slate-800 hover:bg-slate-700 text-white px-2.5 py-1 rounded-lg border border-slate-700 transition"
                >
                  Test invalid allocation (rejected)
                </button>
                <button
                  type="button"
                  onClick={() => setAmountVnd(campaign.milestones.find(m => m.id === selectedMilestoneId)!.budgetVnd)}
                  className="text-[11px] font-semibold bg-slate-800 hover:bg-slate-700 text-white px-2.5 py-1 rounded-lg border border-slate-700 transition"
                >
                  Restore milestone allocation
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleSelectMilestone('M2');
                  }}
                  className="text-[11px] font-semibold bg-rose-950/80 hover:bg-rose-900 text-rose-200 px-2.5 py-1 rounded-lg border border-rose-800 transition"
                >
                  Test Locked M2 (Policy R2)
                </button>
              </div>
            </div>

            <button
              disabled={isSubmitting}
              onClick={() =>
                onCreateOrUpdateRequest({
                  milestoneId: selectedMilestoneId,
                  amountVnd,
                  recipientId,
                  purpose,
                })
              }
              className="w-full inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold text-sm py-3.5 px-5 rounded-2xl shadow-md transition"
            >
              {campaign.requests.some((r) => r.milestoneId === selectedMilestoneId) ? (
                <>
                  <Edit3 className="w-4 h-4 text-emerald-400" />
                  <span>Update Request & Recompute Hash (Resets Approvals)</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 text-emerald-400" />
                  <span>Submit New Disbursement Request</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Card: Submit Completion Evidence */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-5">
          <div className="border-b border-slate-100 pb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-800 bg-teal-50 border border-teal-200 px-2.5 py-1 rounded-lg">
              Module 2 • Submit Evidence
            </span>
            <h2 className="text-lg font-extrabold text-slate-900 mt-2.5">
              Submit Post-Disbursement Evidence
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              After Mock Payment is completed, submit a description and optional document URL so the
              Independent Auditor can verify and unlock the next milestone (Policy{' '}
              <strong>R10</strong>).
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Select Disbursed Milestone
              </label>
              <select
                value={evidenceMilestoneId}
                onChange={(e) => setEvidenceMilestoneId(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                {campaign.milestones.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.id} — {m.title} [{m.status}]
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                VAT Invoice / Handover Certificate ID
              </label>
              <input
                type="text"
                maxLength={100}
                value={invoiceCode}
                onChange={(e) => setInvoiceCode(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Field Implementation Summary
              </label>
              <textarea
                rows={3}
                maxLength={1000}
                value={evidenceDesc}
                onChange={(e) => setEvidenceDesc(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Synthetic Evidence Document URL
              </label>
              <input
                type="url"
                maxLength={500}
                value={fileUrl}
                onChange={(e) => setFileUrl(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <button
              disabled={isSubmitting}
              onClick={() =>
                onSubmitEvidence(evidenceMilestoneId, {
                  description: evidenceDesc,
                  invoiceCode,
                  fileUrl,
                })
              }
              className="w-full inline-flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-bold text-sm py-3.5 px-5 rounded-2xl shadow-md transition"
            >
              <FileUp className="w-4 h-4" />
              <span>Submit Evidence for Independent Auditor Review</span>
            </button>

            {/* Evidence Tracker List */}
            <div className="pt-2 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase">
                <FileText className="w-3.5 h-3.5 text-teal-600" />
                <span>Milestone Evidence Ledger</span>
              </div>
              {campaign.milestones.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between text-xs bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-200"
                >
                  <span className="font-semibold text-slate-800">
                    {m.id} • {m.title}
                  </span>
                  {m.evidence ? (
                    <span
                      className={`inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded-md ${
                        m.evidence.status === 'VERIFIED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {m.evidence.status} ({m.evidence.invoiceCode})
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-slate-400">
                      <Lock className="w-3.5 h-3.5" />
                      Awaiting upload
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
