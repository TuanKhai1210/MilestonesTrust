'use client';
import { ShieldCheck, ExternalLink } from 'lucide-react';
import type { AuthenticatedUser, BusinessRole } from '../types/frontend';

export default function SecurityGovernance({ consoleUrl, demo, currentUser }: { consoleUrl: string | null; demo: boolean; currentUser: AuthenticatedUser }) {
  const permissions: { label: string; role: BusinessRole }[] = [
    { label: 'Request funding, revise own unpaid request, submit evidence', role: 'PROJECT_TEAM' },
    { label: 'Record sponsor approval, execute approved mock payment', role: 'SPONSOR' },
    { label: 'Record auditor approval, verify delivery', role: 'AUDITOR' },
  ];
  return <section className="bg-white border border-slate-200 rounded-3xl p-8 space-y-6 text-slate-800">
    <ShieldCheck className="text-emerald-700" size={36}/>
    <h2 className="text-3xl font-bold">Shared oversight, at two levels.</h2>
    <p className="rounded-xl bg-amber-50 border border-amber-200 p-4">{demo ? 'Local demo uses simulated identities. Live TideCloak login and QEA are not connected in this mode.' : 'Live QEA verification is pending. A configured adapter alone does not prove the realm quorum is enforced.'}</p>
    <div className="grid md:grid-cols-3 gap-5">
      <article><h3 className="font-bold">Funding approvals</h3><p>Sponsor and auditor must be different people and approve the current request hash. The application server enforces these rules.</p></article>
      <article><h3 className="font-bold">Identity governance</h3><p>Planned setup: three independently enrolled realm admins, quorum two. Verify that a protected role change stays pending with one approval, applies after two, and appears in a fresh token.</p></article>
      <article><h3 className="font-bold">Simulated funds</h3><p>No real money moves. Payment records and milestone rules live in this application and its SQLite database.</p></article>
    </div>
    <div className="overflow-x-auto"><h3 className="font-bold mb-3">Your campaign access · {currentUser.displayName}</h3>
      <table className="w-full text-sm text-left"><thead><tr className="border-b"><th className="p-2">Action</th><th className="p-2">Required role</th><th className="p-2">Your role eligibility</th></tr></thead><tbody>
        {permissions.map(p => <tr key={p.role} className="border-b"><td className="p-2">{p.label}</td><td className="p-2">{p.role}</td><td className="p-2">{currentUser.roles.includes(p.role) ? 'Eligible' : 'No access'}</td></tr>)}
      </tbody></table>
      <p className="text-sm mt-3">Public visitors can view this synthetic campaign. Platform admins gain no spending rights from their admin role. Role eligibility does not bypass separate-person approvals, current-version checks or milestone rules. Every write is checked by the backend.</p>
    </div>
    <a className="inline-flex items-center gap-2 text-emerald-800 underline" href={consoleUrl || 'https://docs.tide.org/Admin/SetupIGA'} target="_blank" rel="noreferrer">{consoleUrl ? 'Open Tide Console' : 'QEA setup guide'}<ExternalLink size={16}/></a>
    <p className="text-sm text-slate-600">Live enrollment, application login and QEA still require the team’s realm. QEA governs protected identity changes; it does not make payment records immutable or protect the app from a fully compromised server. Master-realm administration is outside this quorum boundary.</p>
  </section>;
}
