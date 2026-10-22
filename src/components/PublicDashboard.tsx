// components/PublicDashboard.tsx
'use client';

import React from 'react';
import {
  Lock,
  Unlock,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldAlert,
  Banknote,
  FileCheck2,
  Users,
  Sparkles,
  TrendingUp,
  ShieldCheck,
  Layers,
} from 'lucide-react';
import { CampaignState, Milestone } from '@/types/frontend';

interface PublicDashboardProps {
  campaign: CampaignState;
  onNavigate: (tab: string) => void;
}

export default function PublicDashboard({
  campaign,
  onNavigate,
}: PublicDashboardProps) {
  const remainingVnd = campaign.totalBudgetVnd - campaign.releasedBudgetVnd;
  const releasedPercent = Math.round(
    (campaign.releasedBudgetVnd / campaign.totalBudgetVnd) * 100
  );
  const verifiedCount = campaign.milestones.filter(
    (m) => m.status === 'VERIFIED'
  ).length;

  const lifecycleSteps = [
    { step: 1, title: 'Campaign Created', sub: '100M ₫ Committed', done: true },
    { step: 2, title: 'Milestone Activated', sub: 'Stage Unlocked', done: true },
    { step: 3, title: 'Funding Requested', sub: 'Team Submits Plan', done: true },
    {
      step: 4,
      title: '2-Party Quorum',
      sub: 'Sponsor + Auditor',
      done: campaign.releasedBudgetVnd > 0 || campaign.requests.some((r) => r.approvals.length === 2),
    },
    {
      step: 5,
      title: 'Mock Payment',
      sub: 'Single Idempotent Tx',
      done: campaign.releasedBudgetVnd > 0,
    },
    {
      step: 6,
      title: 'Proof Verification',
      sub: 'Auditor Checks Invoice',
      done: verifiedCount > 0,
    },
    {
      step: 7,
      title: 'Next Stage Unlocked',
      sub: 'M2 Becomes Eligible',
      done: verifiedCount > 0,
    },
  ];

  const getStatusBadge = (status: Milestone['status']) => {
    switch (status) {
      case 'LOCKED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
            <Lock className="w-3.5 h-3.5 text-slate-500" />
            LOCKED • Requires Prior Stage Verification
          </span>
        );
      case 'ELIGIBLE':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-sky-50 text-sky-700 border border-sky-200">
            <Unlock className="w-3.5 h-3.5 text-sky-600" />
            ELIGIBLE • Open for Team Request
          </span>
        );
      case 'REQUESTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            REQUESTED • Awaiting 2/2 Consensus
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
            APPROVED • Authorized for Payment
          </span>
        );
      case 'DISBURSED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <Banknote className="w-3.5 h-3.5 text-emerald-600" />
            PAID • Awaiting Evidence Verification
          </span>
        );
      case 'VERIFIED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-600 text-white shadow-sm">
            <FileCheck2 className="w-3.5 h-3.5" />
            VERIFIED & COMPLETED
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Executive Fintech Hero Card */}
      <section className="relative overflow-hidden bg-slate-900 bg-fintech-grid rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-slate-800">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex flex-wrap items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-xs font-bold tracking-wide">
              <Sparkles className="w-3.5 h-3.5" />
              <span>CAMPAIGN #{campaign.id}</span>
              <span>•</span>
              <span>ACTIVE ESCROW GOVERNANCE</span>
              <span>•</span>
              <span>SYNTHETIC HACKATHON DATA</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
              {campaign.title}
            </h1>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              {campaign.subtitle}
            </p>
          </div>

          <div className="flex flex-wrap gap-3 shrink-0">
            <button
              onClick={() => onNavigate('approvals')}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm px-5 py-3 rounded-2xl shadow-lg shadow-emerald-950/60 transition"
            >
              <span>Open Approval Center</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => onNavigate('security')}
              className="inline-flex items-center gap-2 bg-slate-800/90 hover:bg-slate-700 text-white border border-slate-700 font-semibold text-sm px-5 py-3 rounded-2xl transition"
            >
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span>Inspect TideCloak QEA</span>
            </button>
          </div>
        </div>

        {/* 4 Financial KPI Bento Cards */}
        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
          <div className="bg-slate-950/70 backdrop-blur-sm border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
              <span>Committed Budget</span>
              <Layers className="w-4 h-4 text-slate-500" />
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-white mt-2 tabular-nums">
              {campaign.totalBudgetVnd.toLocaleString()} ₫
            </p>
            <p className="text-xs text-slate-400 mt-1.5">
              Allocated across 3 sequential stages
            </p>
          </div>

          <div className="bg-slate-950/70 backdrop-blur-sm border border-emerald-500/30 rounded-2xl p-5">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-emerald-400">
              <span>Released Funds</span>
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-emerald-400 mt-2 tabular-nums">
              {campaign.releasedBudgetVnd.toLocaleString()} ₫
            </p>
            <p className="text-xs text-slate-400 mt-1.5">
              {releasedPercent}% disbursed via 2-party quorum
            </p>
          </div>

          <div className="bg-slate-950/70 backdrop-blur-sm border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-sky-300">
              <span>Protected Reserve</span>
              <Lock className="w-4 h-4 text-sky-400" />
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-sky-300 mt-2 tabular-nums">
              {remainingVnd.toLocaleString()} ₫
            </p>
            <p className="text-xs text-slate-400 mt-1.5">
              Gated by milestone proof & consensus
            </p>
          </div>

          <div className="bg-slate-950/70 backdrop-blur-sm border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-teal-300">
              <span>Verified Stages</span>
              <ShieldCheck className="w-4 h-4 text-teal-400" />
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-teal-300 mt-2 tabular-nums">
              {verifiedCount} / {campaign.milestones.length}
            </p>
            <p className="text-xs text-slate-400 mt-1.5">
              Policy: MILESTONE_TRUST_V{campaign.policyVersion}
            </p>
          </div>
        </div>

        {/* Segmented Progress Allocation Bar (20M / 30M / 50M) */}
        <div className="relative z-10 mt-6 bg-slate-950/80 border border-slate-800 rounded-2xl p-4">
          <div className="flex flex-wrap items-center justify-between text-xs font-semibold text-slate-300 mb-2.5 gap-2">
            <span>Capital Allocation Schedule (M1: 20% • M2: 30% • M3: 50%)</span>
            <span className="font-mono text-emerald-400">
              {campaign.releasedBudgetVnd.toLocaleString()} /{' '}
              {campaign.totalBudgetVnd.toLocaleString()} VND Released
            </span>
          </div>

          <div className="grid grid-cols-10 gap-1.5 h-3.5 rounded-full overflow-hidden bg-slate-900 p-0.5">
            {/* M1: 20% (2 cols) */}
            <div
              className={`col-span-2 rounded-l-full transition-all ${
                campaign.milestones[0]?.status === 'VERIFIED'
                  ? 'bg-emerald-500'
                  : campaign.milestones[0]?.status === 'DISBURSED'
                  ? 'bg-teal-400'
                  : 'bg-amber-400'
              }`}
              title="Milestone 1: 20,000,000 VND"
            />
            {/* M2: 30% (3 cols) */}
            <div
              className={`col-span-3 transition-all ${
                campaign.milestones[1]?.status === 'VERIFIED'
                  ? 'bg-emerald-500'
                  : campaign.milestones[1]?.status === 'ELIGIBLE' ||
                    campaign.milestones[1]?.status === 'REQUESTED'
                  ? 'bg-sky-400'
                  : 'bg-slate-700'
              }`}
              title="Milestone 2: 30,000,000 VND"
            />
            {/* M3: 50% (5 cols) */}
            <div
              className={`col-span-5 rounded-r-full transition-all ${
                campaign.milestones[2]?.status === 'VERIFIED'
                  ? 'bg-emerald-500'
                  : 'bg-slate-800'
              }`}
              title="Milestone 3: 50,000,000 VND"
            />
          </div>

          <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-400 mt-2 font-medium">
            <div>M1: 20.000.000 ₫ (Pilot Deployment)</div>
            <div className="text-center">M2: 30.000.000 ₫ (Community Expansion)</div>
            <div className="text-right">M3: 50.000.000 ₫ (Final Installation)</div>
          </div>
        </div>
      </section>

      {/* 7-Step Grant Lifecycle Flow (From Blueprint Section III) */}
      <section className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
          <div>
            <h2 className="text-base font-extrabold text-slate-900">
              7-Stage Protected Grant Lifecycle
            </h2>
            <p className="text-xs text-slate-500">
              Completing a milestone unlocks the right to request the next stage — it never
              auto-transfers money without fresh 2-party approval.
            </p>
          </div>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
            Zero Single-Admin Custody
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
          {lifecycleSteps.map((item) => (
            <div
              key={item.step}
              className={`rounded-2xl p-3.5 border transition ${
                item.done
                  ? 'bg-emerald-50/70 border-emerald-200 text-slate-900'
                  : 'bg-slate-50 border-slate-200/80 text-slate-500'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span
                  className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-md ${
                    item.done
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  0{item.step}
                </span>
                {item.done && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
              </div>
              <p className="text-xs font-bold leading-snug">{item.title}</p>
              <p className="text-[11px] opacity-80 mt-0.5">{item.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 3 Core Architectural Pillars */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm hover:shadow-md transition">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mb-3">
            <Lock className="w-4 h-4 text-emerald-700" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">
            1. Milestone-Based Funding
          </h3>
          <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
            The 100M ₫ grant is divided into M1 (20M), M2 (30M), and M3 (50M). Later stages
            remain cryptographically & logically locked until prior stage proof is verified.
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm hover:shadow-md transition">
          <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center mb-3">
            <Users className="w-4 h-4 text-teal-700" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">
            2. Multi-Party Approval (2/2)
          </h3>
          <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
            Both the <strong>Sponsor</strong> and an <strong>Independent Auditor</strong>{' '}
            must approve the exact canonical <code className="font-mono text-slate-800">requestHash</code>.
            Editing the amount invalidates prior approvals (Policy R7).
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm hover:shadow-md transition">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center mb-3">
            <ShieldAlert className="w-4 h-4 text-indigo-700" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">
            3. TideCloak Protected Governance
          </h3>
          <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
            Sensitive role assignments are protected by TideCloak QEA (2-of-3{' '}
            <code className="font-mono text-slate-800">tide-realm-admin</code> quorum),
            preventing a rogue admin from self-assigning the Sponsor role.
          </p>
        </div>
      </section>

      {/* Project Milestones Cards */}
      <section className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">
              Project Milestones & Unlock Conditions
            </h2>
            <p className="text-xs text-slate-500">
              Real-time status of all 3 stages for Campaign #{campaign.id}
            </p>
          </div>
          <button
            onClick={() => onNavigate('workspace')}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 inline-flex items-center gap-1"
          >
            <span>Go to Project Team Workspace</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="divide-y divide-slate-200">
          {campaign.milestones.map((m) => {
            const activeReq = campaign.requests.find(
              (r) => r.id === m.activeRequestId
            );
            const isLocked = m.status === 'LOCKED';

            return (
              <div
                key={m.id}
                className={`p-6 transition ${
                  isLocked ? 'bg-slate-50/60' : 'bg-white hover:bg-slate-50/40'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                  <div className="space-y-2 max-w-2xl">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span
                        className={`text-xs font-mono font-bold px-2.5 py-1 rounded-lg ${
                          isLocked
                            ? 'bg-slate-200 text-slate-700'
                            : 'bg-slate-900 text-white'
                        }`}
                      >
                        {m.id}
                      </span>
                      <h3 className="text-base font-extrabold text-slate-900">
                        {m.title}
                      </h3>
                      {getStatusBadge(m.status)}
                    </div>

                    <p className="text-sm text-slate-600 leading-relaxed">
                      {m.description}
                    </p>

                    <div className="text-xs text-slate-500 bg-slate-100/80 px-3.5 py-2 rounded-xl border border-slate-200/70">
                      <strong className="text-slate-700">Release & Verification Rule:</strong>{' '}
                      {m.unlockCondition}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end justify-between gap-3 shrink-0">
                    <div className="text-left lg:text-right">
                      <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">
                        Stage Allocation
                      </span>
                      <p className="text-2xl font-extrabold text-slate-900 tabular-nums">
                        {m.budgetVnd.toLocaleString()} ₫
                      </p>
                    </div>

                    {activeReq ? (
                      <div className="text-xs bg-emerald-50 px-3.5 py-2 rounded-xl border border-emerald-200 text-emerald-950 flex items-center gap-2">
                        <span className="font-mono font-bold">{activeReq.id}</span>
                        <span>•</span>
                        <span>v{activeReq.version}</span>
                        <span>•</span>
                        <span className="font-bold text-emerald-700">
                          {activeReq.approvals.length}/2 Approved
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 font-medium">
                        No active disbursement request
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}