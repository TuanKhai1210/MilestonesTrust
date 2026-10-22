'use client';
import { ShieldCheck, ExternalLink } from 'lucide-react';

export default function SecurityGovernance({ consoleUrl, demo }: { consoleUrl: string | null; demo: boolean }) {
  return <section className="bg-white border border-slate-200 rounded-3xl p-8 space-y-6 text-slate-800">
    <ShieldCheck className="text-emerald-700" size={36}/>
    <h2 className="text-3xl font-bold">Shared oversight, at two levels.</h2>
    <p className="rounded-xl bg-amber-50 border border-amber-200 p-4">{demo ? 'Local demo uses simulated identities. Live TideCloak login and QEA are not connected in this mode.' : 'Live QEA verification is pending. A configured adapter alone does not prove the realm quorum is enforced.'}</p>
    <div className="grid md:grid-cols-3 gap-5">
      <article><h3 className="font-bold">Funding approvals</h3><p>Sponsor and auditor must be different people and approve the current request hash. The application server enforces these rules.</p></article>
      <article><h3 className="font-bold">Identity governance</h3><p>Planned setup: three independently enrolled realm admins, quorum two. Verify that a protected role change stays pending with one approval, applies after two, and appears in a fresh token.</p></article>
      <article><h3 className="font-bold">Simulated funds</h3><p>No real money moves. Payment records and milestone rules live in this application and its SQLite database.</p></article>
    </div>
    <a className="inline-flex items-center gap-2 text-emerald-800 underline" href={consoleUrl || 'https://docs.tide.org/Admin/SetupIGA'} target="_blank" rel="noreferrer">{consoleUrl ? 'Open Tide Console' : 'QEA setup guide'}<ExternalLink size={16}/></a>
    <p className="text-sm text-slate-600">Live enrollment, application login and QEA still require the team’s realm. QEA governs protected identity changes; it does not make payment records immutable or protect the app from a fully compromised server. Master-realm administration is outside this quorum boundary.</p>
  </section>;
}
