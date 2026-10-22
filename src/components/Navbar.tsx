// components/Navbar.tsx
'use client';

import React from 'react';
import {
  ShieldCheck,
  RotateCcw,
  KeyRound,
  LayoutDashboard,
  Briefcase,
  CheckCircle2,
  Lock,
  History,
  Fingerprint,
} from 'lucide-react';
import { AuthenticatedUser, CampaignState /* ... */ } from '../types/frontend';
interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: AuthenticatedUser;
  selectedActorKey: string;
  onSelectActor: (key: string) => void;
  availableIdentities: AuthenticatedUser[];
  onResetDemo: () => void;
  pendingApprovalsCount: number;
  authMode: 'demo' | 'tidecloak';
  authConfigured: boolean;
  sessionBusy?: boolean;
  onSignIn?: () => void;
  onSignOut?: () => void;
}

export default function Navbar({
  activeTab,
  setActiveTab,
  currentUser,
  selectedActorKey,
  onSelectActor,
  availableIdentities,
  onResetDemo,
  pendingApprovalsCount,
  authMode, authConfigured, onSignIn, onSignOut, sessionBusy,
}: NavbarProps) {
  const navItems = [
    { id: 'dashboard', label: 'Public Dashboard', step: '01', icon: LayoutDashboard },
    { id: 'workspace', label: 'Project Workspace', step: '02', icon: Briefcase },
    {
      id: 'approvals',
      label: 'Approval Center',
      step: '03',
      icon: CheckCircle2,
      badge: `${pendingApprovalsCount} pending`,
    },
    { id: 'security', label: 'TideCloak & QEA', step: '04', icon: Lock },
    { id: 'audit', label: 'Public Audit Trail', step: '05', icon: History },
  ];

  const getRoleStyle = (role: string) => {
    switch (role) {
      case 'SPONSOR':
        return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
      case 'AUDITOR':
        return 'bg-teal-500/15 text-teal-300 border-teal-500/30';
      case 'PROJECT_TEAM':
        return 'bg-sky-500/15 text-sky-300 border-sky-500/30';
      default:
        return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
    }
  };

  return (
    <header className="bg-slate-950 text-white border-b border-slate-800/90 sticky top-0 z-40 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Institutional Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between py-3.5 gap-3.5">
          {/* Brand Logo & Slogan */}
          <div className="flex items-center gap-3.5">
            <div className="relative">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-950/80 border border-emerald-300/20">
                <ShieldCheck className="w-6 h-6 text-slate-950 stroke-[2.2]" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 ring-2 ring-slate-950" />
            </div>

            <div>
              <div className="flex items-center gap-2.5">
                <span className="font-extrabold text-lg tracking-tight text-white">
                  MilestoneTrust
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  Tide UNLOCKED • C2
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                “No Proof, No Progress. No Consensus, No Funds.”
              </p>
            </div>
          </div>

          {/* TideCloak Active Session & Demo Persona Switcher */}
          <div className="flex flex-wrap items-center gap-2.5 bg-slate-900/95 border border-slate-800 rounded-2xl p-2 shadow-inner">
            <div className="flex items-center gap-1.5 pl-2 text-xs text-slate-400">
              <Fingerprint className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="font-semibold text-slate-300 hidden sm:inline">
                {authMode === 'demo' ? 'Simulated identity:' : 'Participant:'}
              </span>
            </div>

            {authMode === 'demo' ? <><select
              aria-label="Demo identity"
              value={selectedActorKey}
              disabled={sessionBusy || Boolean(currentUser.sub)}
              onChange={(e) => onSelectActor(e.target.value)}
              className="bg-slate-950 hover:bg-slate-900 text-white text-xs font-semibold rounded-xl px-3 py-2 border border-slate-700/80 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition cursor-pointer"
            >
              {availableIdentities.map((id) => (
                <option key={id.key || id.sub} value={id.key || id.sub}>
                  {id.displayName} • [{id.roles.join(', ')}]
                </option>
              ))}
            </select><button disabled={sessionBusy} onClick={currentUser.sub ? onSignOut : onSignIn} className="px-3 py-2 text-xs rounded-lg border border-emerald-700 disabled:opacity-50">{sessionBusy ? 'Please wait…' : currentUser.sub ? 'Sign out (demo)' : 'Simulate sign-in'}</button></> : currentUser.sub ? <button onClick={onSignOut} className="px-3 py-2 text-xs">{currentUser.displayName} · Sign out</button> : <button disabled={!authConfigured} onClick={onSignIn} className="px-3 py-2 text-xs disabled:opacity-50">Sign in with TideCloak</button>}

            <div className="hidden xl:flex items-center gap-1.5">
              {currentUser.roles.map((role) => (
                <span
                  key={role}
                  className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border ${getRoleStyle(
                    role
                  )}`}
                >
                  {role}
                </span>
              ))}
              <span className="text-[11px] font-mono text-slate-400 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                sub: {currentUser.sub}
              </span>
            </div>

            <button
              onClick={onResetDemo}
              title="Refresh workspace from server"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-1.5 rounded-xl transition"
            >
              <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
              <span>Refresh workspace</span>
            </button>
          </div>
        </div>

        {/* Navigation Bar */}
        <nav
          aria-label="Main navigation"
          className="flex items-center gap-1.5 overflow-x-auto py-2 border-t border-slate-900 no-scrollbar"
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`group relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-950/50'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                    isActive
                      ? 'bg-black/25 text-emerald-100'
                      : 'bg-slate-900 text-slate-500 group-hover:text-slate-300'
                  }`}
                >
                  {item.step}
                </span>
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
                {item.badge && (
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                      isActive
                        ? 'bg-white text-emerald-900'
                        : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
