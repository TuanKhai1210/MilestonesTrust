'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { TideCloakProvider, useTideCloak } from '@tidecloak/nextjs';
import { ArrowDownLeft, ArrowRight, Check, CheckCheck, ChevronDown, Clock3, Droplets, ExternalLink, FileCheck2, Fingerprint, Flag, HeartHandshake, LayoutDashboard, LockKeyhole, LogOut, RefreshCw, ShieldCheck, Users, Wallet, X } from 'lucide-react';

type Auth = { mode: 'demo'|'tidecloak'; configured: boolean; clientConfig: Record<string, unknown>|null; consoleUrl: string|null };
type Actor = { sub: string; name: string; roles: string[] };
type Milestone = { id: string; seq: number; title: string; amount: number; status: string; evidence: string|null };
type Funding = { id: string; milestone_id: string; amount: number; recipient: string; purpose: string; version: number; hash: string; status: string };
type State = { auth: Auth; actor: Actor|null; milestones: Milestone[]; requests: Funding[]; approvals: {request_id:string;role:string}[]; payments:{id:string;request_id:string;amount:number}[];audit:{id:number;event:string;detail:string;created_at:string}[] };
const money = (amount:number) => new Intl.NumberFormat('en-US').format(amount);
const labels: Record<string,string> = { LOCKED:'Locked', ELIGIBLE:'Open for funding', REQUESTED:'Awaiting approvals', APPROVED:'Ready to release', DISBURSED:'Evidence needed', VERIFIED:'Verified' };
const names:Record<string,string> = { team:'Project team', sponsor:'Sponsor', auditor:'Independent auditor', admin:'Platform admin' };

export default function App() {
  const [auth,setAuth]=useState<Auth|null>(null); const [error,setError]=useState('');
  useEffect(()=>{fetch('/api/state').then(async r=>{const x=await r.json();if(!r.ok)throw Error(x.error);setAuth(x.auth);}).catch(e=>setError(e.message));},[]);
  if(error)return <div className="boot"><Droplets size={36}/><h1>Unable to open the workspace</h1><p>{error}</p><button onClick={()=>location.reload()}>Try again</button></div>;
  if(!auth)return <div className="boot"><Droplets size={36}/><p>Opening MilestoneTrust…</p></div>;
  if(auth.mode==='tidecloak' && auth.configured && auth.clientConfig)return <TideCloakProvider config={auth.clientConfig}><Connected auth={auth}/></TideCloakProvider>;
  return <Workspace auth={auth}/>;
}
function Connected({auth}:{auth:Auth}) {
  const tide=useTideCloak();
  const headers=useMemo<Record<string,string>>(()=>{const result:Record<string,string>={};if(tide.token)result.Authorization=`Bearer ${tide.token}`;return result;},[tide.token]);
  useEffect(()=>{if(tide.authenticated && location.pathname==='/auth/redirect') history.replaceState({},'','/');},[tide.authenticated]);
  return <Workspace auth={auth} tokenHeaders={headers} signIn={()=>tide.login()} signOut={()=>tide.logout()} authError={tide.initError ? 'TideCloak initialization failed. Check your adapter, redirect URIs and server.' : ''}/>;
}
function Workspace({auth,tokenHeaders,signIn,signOut,authError}:{auth:Auth;tokenHeaders?:Record<string,string>;signIn?:()=>void;signOut?:()=>void;authError?:string}) {
  const [demo,setDemo]=useState('team');const [state,setState]=useState<State|null>(null);
  const [view,setView]=useState('workspace');const [selected,setSelected]=useState('M1');
  const [notice,setNotice]=useState('');const [error,setError]=useState('');const [busy,setBusy]=useState(false);
  const [recipient,setRecipient]=useState('WaterWorks Co-op');const [purpose,setPurpose]=useState('Purchase and install pilot water filtration equipment');
  const [evidence,setEvidence]=useState('');const [editing,setEditing]=useState(false);
  const headers=useMemo<Record<string,string>>(()=>auth.mode==='demo'?{'x-demo-role':demo}:tokenHeaders||{},[auth.mode,demo,tokenHeaders]);
  const load=useCallback(async()=>{try {const r=await fetch('/api/state',{headers});const x=await r.json();if(!r.ok)throw Error(x.error);setState(x);setError('');}catch(e){setError((e as Error).message);}},[headers]);
  useEffect(()=>{void load();},[load]);
  async function action(body:Record<string,unknown>,message:string) {
    setBusy(true);setError('');setNotice('');
    try {const r=await fetch('/api/actions',{method:'POST',headers:{...headers,'Content-Type':'application/json'},body:JSON.stringify(body)});const x=await r.json();if(!r.ok)throw Error(x.error);await load();setNotice(message);setEditing(false);}catch(e){setError((e as Error).message);}finally{setBusy(false);}
  }
  const actor=state?.actor;const can=(role:string)=>Boolean(actor?.roles.includes(role));
  const milestone=state?.milestones.find(m=>m.id===selected);
  const funding=state?.requests.find(r=>r.milestone_id===selected);
  const approvals=state?.approvals.filter(a=>a.request_id===funding?.id)||[];
  const released=state?.payments.reduce((s,p)=>s+p.amount,0)||0;
  const verified=state?.milestones.filter(m=>m.status==='VERIFIED').length||0;
  const approve=(role:string)=>action({action:'approve',requestId:funding?.id,requestHash:funding?.hash,role},'Approval recorded for this request version.');
  const requestForm=(edit=false)=><form onSubmit={e=>{e.preventDefault();void action({action:edit?'edit':'request',milestoneId:selected,amount:milestone?.amount,recipient,purpose},edit?'Request revised. Both approvals must be collected again.':'Funding request sent for independent review.');}}>
    <label>Recipient<input required maxLength={100} value={recipient} onChange={e=>setRecipient(e.target.value)}/></label>
    <label>Purpose<textarea required maxLength={500} value={purpose} onChange={e=>setPurpose(e.target.value)}/></label>
    <div className="form-footer"><span>Fixed allocation <b>{money(milestone?.amount||0)} VND</b></span><button disabled={busy} className="primary">{edit?'Save new version':'Request funding'}<ArrowRight size={16}/></button></div>
  </form>;
  return <div className="shell">
    <aside className="sidebar"><a className="brand" href="/"><span className="brand-icon"><Droplets size={23}/></span><span>Milestone<span className="brand-light">Trust</span><small>PROGRESS WITH PURPOSE</small></span></a>
      <div className="workspace-label">YOUR WORKSPACE</div><div className="workspace-switch"><span className="square-icon"><HeartHandshake size={18}/></span><div>Community relief<small>Campaign CWF-001</small></div><ChevronDown size={15}/></div>
      <nav>{[['workspace','Campaign workspace',LayoutDashboard],['governance','Identity governance',ShieldCheck],['activity','Activity log',Clock3]].map(([key,label,Icon])=><button key={String(key)} className={view===key?'nav active':'nav'} onClick={()=>setView(String(key))}>{typeof Icon!=='string'&&<Icon size={18}/>}<span>{String(label)}</span>{view===key&&<span className="nav-dot"/>}</button>)}</nav>
      <div className="sidebar-note"><ShieldCheck size={21}/><strong>Accountability, together.</strong><p>Project teams request. Independent people approve. Progress opens the next stage.</p><span className="tiny-label">RMIT HACKATHON 2026</span></div>
      <div className="sidebar-bottom"><span className="live-dot"/> {auth.mode==='demo'?'Local demonstration':'TideCloak authentication'}<small>Synthetic data. Simulated funds.</small></div>
    </aside>
    <main><header className="topbar"><span>Community relief <span className="slash">/</span> <b>{view==='workspace'?'Campaign workspace':view==='governance'?'Identity governance':'Activity log'}</b></span><div className="session-controls">{auth.mode==='demo'?<><span className="demo-label">DEMO IDENTITY</span><select aria-label="Demo identity" value={demo} onChange={e=>{setDemo(e.target.value);setNotice('');setError('');}}>{Object.entries(names).map(([key,name])=><option key={key} value={key}>{name}</option>)}</select></>:actor?<><span className="identity"><Fingerprint size={16}/>{actor.name}</span><button className="icon-button" title="Sign out" onClick={signOut}><LogOut size={17}/></button></>:<button className="primary small" onClick={signIn} disabled={!auth.configured}>Sign in with TideCloak</button>}<button className="icon-button" title="Refresh workspace" onClick={()=>void load()}><RefreshCw size={17}/></button></div></header>
      <div className="content">
        {auth.mode==='demo'&&<div className="mode-banner">Local demo uses simulated identities. Live TideCloak login and QEA are not connected in this mode.</div>}
        {auth.mode==='tidecloak'&&!auth.configured&&<div className="mode-banner">TideCloak setup required. Public campaign is visible. Protected actions stay locked until a valid adapter and login are configured. See config/README.md.</div>}
        {(error||authError)&&<div className="alert error" role="alert"><X size={17}/>{error||authError}</div>}{notice&&<div className="alert success" role="status"><Check size={17}/>{notice}</div>}
        {view==='workspace'?<>
          <div className="eyebrow"><span className="pill green">COMMUNITY RELIEF</span><span>CWF-001</span></div>
          <div className="hero"><div><h1>Clean water for<br/>flood communities.</h1><p>A community-led water project, funded one verified milestone at a time.</p></div><div className="hero-stamp"><Droplets size={28}/><span>Safer water.<br/><strong>Shared responsibility.</strong></span></div></div>
          <div className="stats"><div><span>Total committed</span><strong>100,000,000 <small>VND</small></strong><p>Across three project milestones</p></div><div><span>Released to the project</span><strong>{money(released)} <small>VND</small></strong><p><ArrowDownLeft size={13}/> Simulated payments only</p></div><div><span>Milestones verified</span><strong>{verified}<small> / 3</small></strong><p>{verified===0?'First delivery is awaiting verification':`${3-verified} stages remain`}</p></div></div>
          <div className="section-heading"><div><h2>Funding milestones</h2><p>Each stage earns the right to request the next release.</p></div><span className="muted">100M VND allocated</span></div>
          <div className="milestones">{state?.milestones.map(m=><button key={m.id} onClick={()=>{setSelected(m.id);setEditing(false);setError('');setNotice('');}} className={`milestone ${selected===m.id?'selected':''}`}><div className="milestone-top"><span className={`step ${m.status==='VERIFIED'?'done':''}`}>{m.status==='LOCKED'?<LockKeyhole size={16}/>:m.status==='VERIFIED'?<Check size={17}/>:String(m.seq).padStart(2,'0')}</span><span className={`status status-${m.status.toLowerCase()}`}>{labels[m.status]}</span></div><h3>{m.title}</h3><div className="allocation">{money(m.amount)} <span>VND</span></div><p>{m.seq===1?'Equipment and first on-site installation':`Requires verified completion of milestone ${m.seq-1}`}</p></button>)}</div>
          <div className="workspace-grid"><section className="panel request-panel"><div className="panel-heading"><div><span className="tiny-label">MILESTONE {milestone?.seq||1}</span><h2>{milestone?.title||'Loading campaign…'}</h2></div><FileCheck2 size={22}/></div>
            {milestone?.status==='LOCKED'?<div className="empty-state"><LockKeyhole size={30}/><h3>This stage is still locked</h3><p>The auditor must verify the previous milestone before the team can request this allocation.</p></div>:!funding?can('mt_team')?requestForm():<div className="empty-state"><Flag size={30}/><h3>Ready for a project request</h3><p>The project team can submit the recipient and purpose for this milestone.</p></div>:<>
              <div className="request-summary"><div><span>Requested allocation</span><strong>{money(funding.amount)} <small>VND</small></strong></div><span className="pill">VERSION {funding.version}</span></div>
              <div className="detail-line"><span>Recipient</span><b>{funding.recipient}</b></div><div className="purpose">{funding.purpose}</div>
              <div className="approvals">{(['mt_sponsor','mt_auditor'] as const).map(role=>{const approved=approvals.some(a=>a.role===role);return <div className={`approval ${approved?'approved':''}`} key={role}><div className="approval-icon">{approved?<CheckCheck size={18}/>:<Users size={18}/>}</div><div><strong>{role==='mt_sponsor'?'Sponsor':'Independent auditor'}</strong><span>{approved?'Approved this version':'Review required'}</span></div><button className="outline small" disabled={busy||approved||!can(role)||funding.status!=='PENDING'} onClick={()=>void approve(role)}>{approved?'Approved':'Approve'}</button></div>;})}</div>
              <div className="release-row"><span>{funding.status==='PAID'?<><Check size={16}/> Payment recorded</>:`${approvals.length} of 2 independent approvals`}</span><button className="primary" disabled={busy||!can('mt_sponsor')||funding.status!=='APPROVED'} onClick={()=>void action({action:'pay',requestId:funding.id},'Simulated payment recorded exactly once. No real funds moved.')}><Wallet size={16}/>Release simulated funds</button></div>
              {can('mt_team')&&funding.status!=='PAID'&&<button className="text-button" onClick={()=>{setEditing(!editing);setRecipient(funding.recipient);setPurpose(funding.purpose);}}>Revise request and clear approvals</button>}{editing&&requestForm(true)}
              {funding.status==='PAID'&&milestone?.status!=='VERIFIED'&&<div className="evidence"><h3>Verify the outcome</h3><p>Record the delivery evidence before the next stage opens.</p>{milestone?.evidence&&<blockquote>{milestone.evidence}</blockquote>}{can('mt_team')&&<form onSubmit={e=>{e.preventDefault();void action({action:'evidence',milestoneId:selected,evidence},'Evidence submitted for auditor review.');}}><textarea aria-label="Delivery evidence" required maxLength={2000} value={evidence} onChange={e=>setEvidence(e.target.value)} placeholder="Describe the synthetic invoice and delivery confirmation…"/><button className="outline" disabled={busy}>Submit evidence</button></form>}{can('mt_auditor')&&<button className="primary" disabled={busy||!milestone?.evidence} onClick={()=>void action({action:'verify',milestoneId:selected},'Milestone verified. The next stage is open for a new request.')}><FileCheck2 size={16}/>Verify delivery and unlock next stage</button>}</div>}
              {milestone?.status==='VERIFIED'&&<div className="verified-note"><CheckCheck size={20}/> Delivery verified. The next stage may request funding.</div>}
            </>}
          </section><aside className="panel trust-panel"><span className="square-icon"><ShieldCheck size={21}/></span><h2>Two layers of accountability.</h2><div className="trust-step"><span>01</span><div><h3>Independent funding decisions</h3><p>The sponsor and auditor approve the same request. Editing it clears both approvals.</p></div></div><div className="trust-step"><span>02</span><div><h3>Governed identity changes</h3><p>TideCloak QEA requires a realm-admin quorum for protected role changes.</p></div></div><div className="trust-footnote">Payments and milestone rules run in this prototype’s backend. QEA governs identity changes.</div><button className="text-button" onClick={()=>setView('governance')}>View identity governance <ArrowRight size={15}/></button></aside></div>
        </>:view==='governance'?<>
          <div className="eyebrow"><span className="pill green">TIDECLOAK</span><span>IDENTITY GOVERNANCE</span></div><h1 className="single-title">No unilateral role changes.</h1><p className="intro">Verify who can change the people and permissions behind this campaign.</p>
          <section className="panel governance"><ShieldCheck size={36}/><h2>{auth.mode==='demo'?'Live QEA is not connected':auth.configured?'Open the live Tide Console':'Configure your TideCloak realm'}</h2><p>Use three independently enrolled realm admins. The documented quorum is two. A proposed role change must remain pending below quorum, then apply after the second approval.</p><div className="governance-facts"><div><span>Business approval</span><b>Sponsor + Auditor</b><small>Enforced by this app</small></div><div><span>Identity governance</span><b>Live TideCloak QEA</b><small>Verify in your realm</small></div><div><span>Payment rail</span><b>Simulated</b><small>No real funds transferred</small></div></div>
          {auth.consoleUrl?<a className="primary" target="_blank" rel="noreferrer" href={auth.consoleUrl}>Open Tide Console<ExternalLink size={16}/></a>:<a className="outline" href="https://docs.tide.org/Admin/SetupIGA" target="_blank" rel="noreferrer">QEA setup guide<ExternalLink size={16}/></a>}
          <div className="boundary"><h3>What this prototype proves</h3><p>Independent application approvals, version binding, replay-safe mock payments, and milestone sequencing can be tested here. Live authentication and QEA must be exercised with your configured Tide realm. This app does not simulate QEA evidence or protect its SQLite database from its own server administrator.</p></div></section>
        </>:<><div className="eyebrow"><span className="pill green">CAMPAIGN RECORD</span></div><h1 className="single-title">Every step, in the open.</h1><p className="intro">An application activity log for this synthetic campaign. It is not an immutable cryptographic ledger.</p><section className="panel activity">{state?.audit.length?state.audit.map(a=><div className="activity-item" key={a.id}><span className="activity-dot"/><div><strong>{a.event}</strong><p>{a.detail}</p><time>{new Date(a.created_at).toLocaleString()}</time></div></div>):<div className="empty-state"><Clock3 size={30}/><h3>A fresh start</h3><p>The first funding request will appear here.</p></div>}</section></>}
        <footer><span>MilestoneTrust</span><span>Built for communities. Governed together.</span><span>RMIT × Tide · Challenge 2</span></footer>
      </div>
    </main>
  </div>;
}
