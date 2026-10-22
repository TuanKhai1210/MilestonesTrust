'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { TideCloakProvider, useTideCloak } from '@tidecloak/nextjs';
import Navbar from '../components/Navbar';
import PublicDashboard from '../components/PublicDashboard';
import ProjectWorkspace from '../components/ProjectWorkspace';
import ApprovalCenter from '../components/ApprovalCenter';
import SecurityGovernance from '../components/SecurityGovernance';
import AuditTrail from '../components/AuditTrail';
import { backendJson, campaignView, demoPeople, displayActor, safeReference, type ServerActor, type Snapshot } from '../lib/frontend';

type Auth = { mode: 'demo' | 'tidecloak'; configured: boolean; clientConfig: Record<string, unknown> | null; consoleUrl: string | null };
type State = Snapshot & { auth: Auth; actor: ServerActor | null };

export default function App() {
  const [auth, setAuth] = useState<Auth | null>(null);
  const [error, setError] = useState('');
  useEffect(() => { fetch('/api/state').then(backendJson<State>).then(state => setAuth(state.auth)).catch(e => setError(e.message)); }, []);
  if (error) return <main className="p-8"><h1>Unable to open workspace</h1><p role="alert">{error}</p><button onClick={() => location.reload()}>Try again</button></main>;
  if (!auth) return <main className="p-8">Opening MilestoneTrust…</main>;
  if (auth.mode === 'tidecloak' && auth.configured && auth.clientConfig) return <TideCloakProvider config={auth.clientConfig}><Connected auth={auth}/></TideCloakProvider>;
  return <Workspace auth={auth}/>;
}

function Connected({ auth }: { auth: Auth }) {
  const tide = useTideCloak();
  const headers = useMemo((): Record<string, string> => tide.token ? { Authorization: `Bearer ${tide.token}` } : {}, [tide.token]);
  useEffect(() => { if (tide.authenticated && location.pathname === '/auth/redirect') history.replaceState({}, '', '/'); }, [tide.authenticated]);
  return <Workspace auth={auth} tokenHeaders={headers} signIn={() => tide.login()} signOut={() => tide.logout()} authError={tide.initError ? 'TideCloak initialization failed. Check the adapter and redirect URIs.' : ''}/>;
}

function Workspace({ auth, tokenHeaders, signIn, signOut, authError }: { auth: Auth; tokenHeaders?: Record<string, string>; signIn?: () => void; signOut?: () => void; authError?: string }) {
  const demo = auth.mode === 'demo';
  const [actorKey, setActorKey] = useState('team_01');
  const [tab, setTab] = useState('dashboard');
  const [state, setState] = useState<State | null>(null);
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);
  const [feedback, setFeedback] = useState<{ error: boolean; text: string } | null>(null);
  const headers = useMemo<Record<string, string>>(() => demo ? { 'x-demo-role': demoPeople.find(p => p.key === actorKey)!.username } : tokenHeaders || {}, [demo, actorKey, tokenHeaders]);
  const readState = useCallback((withHeaders = headers) => fetch('/api/state', { headers: withHeaders, cache: 'no-store' }).then(backendJson<State>), [headers]);
  useEffect(() => {
    let current = true;
    setState(null);
    readState().then(next => { if (current) setState(next); }).catch(e => { if (current) setFeedback({ error: true, text: e.message }); });
    return () => { current = false; };
  }, [readState]);
  async function refresh() {
    try { setState(await readState()); setFeedback(null); } catch (e) { setFeedback({ error: true, text: (e as Error).message }); }
  }
  async function mutate(body: Record<string, unknown>, message: string, overrideKey?: string) {
    if (inFlight.current) return;
    inFlight.current = true; setBusy(true); setFeedback(null);
    try {
      if (overrideKey && !demo) throw new Error('Identity switching is available only in local demo mode.');
      const actionHeaders = overrideKey ? { 'x-demo-role': demoPeople.find(p => p.key === overrideKey)!.username } : headers;
      await backendJson(await fetch('/api/actions', { method: 'POST', headers: { ...actionHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify(body) }));
      setState(await readState());
      setFeedback({ error: false, text: message });
    } catch (e) { setFeedback({ error: true, text: (e as Error).message }); } finally { inFlight.current = false; setBusy(false); }
  }
  const user = displayActor(state?.actor || null, demo);
  const campaign = state ? campaignView(state) : null;
  function approve(id: string, hash: string, role?: 'SPONSOR' | 'AUDITOR', overrideKey?: string) {
    const selected = role || (user.roles.includes('SPONSOR') ? 'SPONSOR' : 'AUDITOR');
    return mutate({ action: 'approve', requestId: id, requestHash: hash, role: selected === 'SPONSOR' ? 'mt_sponsor' : 'mt_auditor' }, 'Approval recorded by the server for this request version.', overrideKey);
  }
  return <div className="min-h-screen bg-slate-50 text-slate-900">
    <Navbar activeTab={tab} setActiveTab={setTab} currentUser={user} selectedActorKey={actorKey} onSelectActor={key => { if (!busy && demo) { setActorKey(key); setFeedback(null); } }} availableIdentities={demo ? demoPeople : []} onResetDemo={() => void refresh()} pendingApprovalsCount={campaign?.requests.filter(r => r.status === 'PENDING_APPROVAL').length || 0} authMode={auth.mode} authConfigured={auth.configured} onSignIn={signIn} onSignOut={signOut}/>
    <main className="max-w-7xl mx-auto p-4 sm:p-8 space-y-6">
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm">{demo ? 'LOCAL DEMO — simulated identities, synthetic campaign and mock payments. Live TideCloak login and QEA are not connected.' : auth.configured ? 'Synthetic campaign and mock payments. Signed-in roles are verified by the server. Live QEA verification remains pending.' : 'TideCloak setup required. Public data is visible; protected actions require a configured adapter and valid login.'}</div>
      {(feedback || authError) && <div role={feedback?.error || authError ? 'alert' : 'status'} className={`border rounded-xl p-4 ${feedback?.error || authError ? 'bg-rose-50 border-rose-300' : 'bg-emerald-50 border-emerald-300'}`}>{feedback?.text || authError}</div>}
      {!campaign ? <p>Loading campaign… <button onClick={() => void refresh()} className="underline">Retry</button></p> : <>
        {tab === 'dashboard' && <PublicDashboard campaign={campaign} onNavigate={setTab}/>}
        {tab === 'workspace' && <ProjectWorkspace campaign={campaign} currentUser={user} isSubmitting={busy} onCreateOrUpdateRequest={payload => mutate({ action: campaign.requests.some(r => r.milestoneId === payload.milestoneId) ? 'edit' : 'request', milestoneId: payload.milestoneId, amount: payload.amountVnd, recipient: payload.recipientId, purpose: payload.purpose }, 'Request saved by the server. Any previous approvals were cleared.')} onSubmitEvidence={(id, payload) => {
          if (payload.fileUrl && !safeReference(payload.fileUrl)) { setFeedback({ error: true, text: 'Evidence reference must be an HTTP or HTTPS URL.' }); return Promise.resolve(); }
          return mutate({ action: 'evidence', milestoneId: id, evidence: JSON.stringify(payload) }, 'Evidence recorded for auditor review.');
        }}/>}
        {tab === 'approvals' && <ApprovalCenter campaign={campaign} currentUser={user} isSubmitting={busy} allowDemoSwitch={demo} onApproveRequest={approve} onSwitchActorAndApprove={(key, id, hash) => approve(id, hash, 'SPONSOR', key)} onExecutePayment={id => mutate({ action: 'pay', requestId: id }, 'Mock payment recorded. No real funds moved.')} onVerifyEvidence={id => mutate({ action: 'verify', milestoneId: id }, id === 'M3' ? 'All three milestones verified.' : 'Milestone verified. Next stage is open for a new request.')}/>}
        {tab === 'security' && <SecurityGovernance consoleUrl={auth.consoleUrl} demo={demo}/>}
        {tab === 'audit' && <AuditTrail events={campaign.auditEvents}/>}
      </>}
      <footer className="text-xs text-slate-500 border-t pt-4">MilestoneTrust · Synthetic relief campaign · Server-enforced workflow · Live TideCloak governance verification pending</footer>
    </main>
  </div>;
}
