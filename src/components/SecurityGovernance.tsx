// components/SecurityGovernance.tsx
'use client';

import React, { useState } from 'react';
import {
  KeyRound,
  ExternalLink,
  Clock,
  AlertOctagon,
  Server,
  ShieldCheck,
  UserX,
  CheckCircle2,
} from 'lucide-react';
import { AuthenticatedUser, CampaignState } from '@/types/frontend';

interface SecurityGovernanceProps {
  campaign: CampaignState;
  currentUser: AuthenticatedUser;
}

export default function SecurityGovernance({
  campaign,
}: SecurityGovernanceProps) {
  const [testedUncommittedRole, setTestedUncommittedRole] = useState(false);
  const qeaReq = campaign.qeaPendingRequests[0];

  return (
    <div className="space-y-6">
      {/* TideCloak QEA Hero Banner */}
      <section className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-3xl">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
              <KeyRound className="w-3.5 h-3.5" />
              TideCloak Quorum Enforced Authorization (QEA)
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Why a Rogue Admin Cannot Steal the Fund
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              In standard web apps, a single platform administrator can quietly grant the{' '}
              <code className="font-mono text-white">SPONSOR</code> role to a secondary
              account they control. MilestoneTrust configures{' '}
              <strong>3 independent <code className="font-mono">tide-realm-admin</code> accounts</strong>{' '}
              with a <strong>2-of-3 QEA quorum threshold</strong>.
            </p>
          </div>

          <a
            href="http://localhost:8080"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 bg-white text-slate-950 hover:bg-slate-100 font-bold text-xs sm:text-sm px-5 py-3 rounded-2xl shadow-lg shrink-0 transition"
          >
            <span>Open TideCloak Console (:8080)</span>
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Card: Scenario B - Rogue Admin Role Escalation Blocked by QEA */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-sm space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-800 bg-rose-50 px-3 py-1 rounded-lg border border-rose-200">
              Scenario B • Privilege Escalation Blocked
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-amber-900 bg-amber-100 border border-amber-300 px-3 py-1 rounded-full">
              <Clock className="w-3.5 h-3.5" />
              Change Pending — {qeaReq.currentApprovals}/{qeaReq.requiredQuorum} Quorum
            </span>
          </div>

          <div>
            <h3 className="text-lg font-extrabold text-slate-900">
              Admin Attempts to Self-Assign{' '}
              <code className="font-mono text-rose-600">SPONSOR</code> Role
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Live representation of TideCloak QEA holding an unauthorized role assignment
              in draft state until a second realm admin approves.
            </p>
          </div>

          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Initiating Admin:</span>
              <span className="font-mono font-bold text-slate-900">
                {qeaReq.requestedByAdminSub} (Realm Admin #1)
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Target Colluding Account:</span>
              <span className="font-mono font-bold text-slate-900">
                {qeaReq.targetUsername} ({qeaReq.targetUserSub})
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Proposed Role Grant:</span>
              <span className="font-mono font-extrabold text-emerald-700">
                + {qeaReq.requestedRole}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">JWT Token Effect:</span>
              <span className="font-bold text-rose-600">
                NOT COMMITTED (Requires 2/3 Realm Admin Quorum)
              </span>
            </div>
          </div>

          {/* 3 Realm Admins Quorum Nodes */}
          <div className="space-y-2.5">
            <div className="flex justify-between text-xs font-bold text-slate-700">
              <span>TideCloak Realm-Admin Quorum (Threshold: 2 of 3)</span>
              <span className="text-amber-700">1 / 2 Signed</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs">
                <div className="flex items-center justify-between font-bold text-emerald-900">
                  <span>Realm Admin #1</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </div>
                <p className="text-[11px] text-emerald-700 mt-1">
                  Initiated role change proposal
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs">
                <div className="flex items-center justify-between font-bold text-amber-900">
                  <span>Realm Admin #2</span>
                  <Clock className="w-4 h-4 text-amber-600" />
                </div>
                <p className="text-[11px] text-amber-800 mt-1">
                  Refused / Pending review
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                <div className="flex items-center justify-between font-bold text-slate-700">
                  <span>Realm Admin #3</span>
                  <UserX className="w-4 h-4 text-slate-400" />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Refused / Pending review
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={() => setTestedUncommittedRole(true)}
            className="w-full py-3 px-4 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs sm:text-sm shadow-md transition"
          >
            Simulate Approval Attempt Using Pending Role Account
          </button>

          {testedUncommittedRole && (
            <div className="p-4 rounded-2xl bg-rose-950 text-rose-100 text-xs space-y-1.5 border border-rose-800">
              <div className="flex items-center gap-2 font-extrabold text-rose-300">
                <AlertOctagon className="w-4 h-4 shrink-0" />
                <span>HTTP 403 FORBIDDEN — ROLE NOT PRESENT IN TIDECLOAK JWT</span>
              </div>
              <p className="leading-relaxed text-rose-200">
                Because TideCloak QEA is holding request <strong>{qeaReq.id}</strong> at{' '}
                <strong>1/2 approvals</strong>, the <code className="font-mono">SPONSOR</code>{' '}
                role claim is never minted into <code className="font-mono">{qeaReq.targetUsername}</code>&apos;s
                access token.
              </p>
            </div>
          )}
        </div>

        {/* Right Card: Honest Technical Protection Boundary Matrix */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-sm space-y-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center">
              <Server className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-slate-900">
                Technical Protection Boundaries
              </h3>
              <p className="text-xs text-slate-500">
                Clear separation between TideCloak QEA and Application Backend enforcement
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase font-bold">
                  <th className="py-2.5 pr-2">Security Question</th>
                  <th className="py-2.5 px-2">Enforcing Layer</th>
                  <th className="py-2.5 pl-2">Verifiable Proof</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700">
                <tr>
                  <td className="py-3 pr-2 font-bold">Who is logged in?</td>
                  <td className="py-3 px-2">
                    <span className="px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-800 font-bold border border-indigo-200">
                      TideCloak OIDC
                    </span>
                  </td>
                  <td className="py-3 pl-2">Verified JWT <code className="font-mono">sub</code> identity</td>
                </tr>
                <tr>
                  <td className="py-3 pr-2 font-bold">Who holds Sponsor/Auditor role?</td>
                  <td className="py-3 px-2">
                    <span className="px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-800 font-bold border border-indigo-200">
                      TideCloak JWT
                    </span>
                  </td>
                  <td className="py-3 pl-2">Signed role claims in token</td>
                </tr>
                <tr>
                  <td className="py-3 pr-2 font-bold">Admin self-assigns Sponsor role?</td>
                  <td className="py-3 px-2">
                    <span className="px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-900 font-bold border border-emerald-300">
                      TideCloak QEA
                    </span>
                  </td>
                  <td className="py-3 pl-2">Change Pending — 1/2 Quorum</td>
                </tr>
                <tr>
                  <td className="py-3 pr-2 font-bold">Are 2 distinct approvals met?</td>
                  <td className="py-3 px-2">
                    <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 font-bold border border-slate-300">
                      App Backend
                    </span>
                  </td>
                  <td className="py-3 pl-2">R5, R6, R7 <code className="font-mono">requestHash</code> check</td>
                </tr>
                <tr>
                  <td className="py-3 pr-2 font-bold">Is next milestone unlocked?</td>
                  <td className="py-3 px-2">
                    <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 font-bold border border-slate-300">
                      Backend + Auditor
                    </span>
                  </td>
                  <td className="py-3 pl-2">R10 Verified completion evidence</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1.5 leading-relaxed">
            <div className="flex items-center gap-1.5 font-bold text-slate-900">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Post-MVP Roadmap: Tide Forseti Transaction Signing</span>
            </div>
            <p>
              In this MVP, TideCloak QEA governs identity and role escalations while the
              application backend enforces disbursement rules (R1–R10). Our next phase binds
              each payout to <strong>Forseti Programmable Policy</strong> so Tide Fabric
              verifies the payload hash and approver quorum before issuing a transaction
              signature.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}