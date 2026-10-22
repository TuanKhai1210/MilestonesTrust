// components/AuditTrail.tsx
'use client';

import React, { useState } from 'react';
import { History, CheckCircle2, ShieldAlert, Hash, Info } from 'lucide-react';
import { AuthenticatedUser, CampaignState /* ... */ } from '../types/frontend';
import { AuditEvent } from '@/types/frontend';
interface AuditTrailProps {
  events: AuditEvent[];
}

export default function AuditTrail({ events }: AuditTrailProps) {
  const [filter, setFilter] = useState<'ALL' | 'RECORDED' | 'BLOCKED_BY_POLICY'>('ALL');

  const filteredEvents = events.filter((e) =>
    filter === 'ALL' ? true : e.status === filter
  );

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center">
              <History className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">
                Public Transparency & Audit Trail
              </h2>
              <p className="text-xs text-slate-500">
                Recent recorded requests, approvals, payments and milestone events
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
            {(['ALL', 'RECORDED', 'BLOCKED_BY_POLICY'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  filter === tab
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab === 'ALL'
                  ? `All (${events.length})`
                  : tab === 'RECORDED'
                  ? 'Recorded'
                  : 'Blocked Abuse'}
              </button>
            ))}
          </div>
        </div>

        {/* Honest MVP Architectural Disclaimer */}
        <div className="bg-sky-50 border border-sky-200 rounded-2xl p-4 flex items-start gap-3 text-xs text-sky-950">
          <Info className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong>Transparency Boundary Note:</strong> Application audit logs provide
            public visibility into successful workflow events in this MVP. Denied actions
            return errors and are not automatically persisted here. Application database
            logs are not a cryptographically immutable ledger.
          </div>
        </div>

        {/* Audit Events Feed */}
        <div className="divide-y divide-slate-200">
          {filteredEvents.map((ev) => {
            const isBlocked = ev.status === 'BLOCKED_BY_POLICY';
            return (
              <div
                key={ev.id}
                className={`py-4 px-4 rounded-2xl transition ${
                  isBlocked ? 'bg-rose-50/70' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {isBlocked ? (
                      <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    )}
                    <span className="text-xs font-mono font-bold text-slate-500">
                      {ev.id}
                    </span>
                    <span
                      className={`text-xs font-extrabold px-2.5 py-0.5 rounded-md ${
                        isBlocked
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : 'bg-slate-900 text-white'
                      }`}
                    >
                      {ev.action}
                    </span>
                    <span className="text-xs font-medium text-slate-700">
                      by <strong>{ev.actorName}</strong> (
                      <code className="font-mono text-[11px]">{ev.actorSub}</code>)
                    </span>
                  </div>

                  <span className="text-[11px] font-mono text-slate-400">
                    {new Date(ev.timestamp).toLocaleTimeString()}
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-slate-700 mt-1.5 pl-6 leading-relaxed">
                  {ev.details}
                </p>

                {ev.requestHash && (
                  <div className="mt-1.5 pl-6 flex items-center gap-1 text-[11px] font-mono text-slate-500">
                    <Hash className="w-3 h-3 text-emerald-600" />
                    <span>requestHash: {ev.requestHash}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
