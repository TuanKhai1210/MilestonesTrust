# MilestoneTrust

Milestone-based relief funding with independent spending approvals and TideCloak-governed identities.

## Project overview

**Vision & originality.** MilestoneTrust turns a community grant into a sequence of accountable releases. A relief team can get started without asking a donor to hand one administrator unrestricted control.

**Trust constraint insight.** Donors need timely delivery and oversight. A single project operator should not both request money and authorize it, or silently give themselves the roles needed to do so.

**Value & impact.** Our synthetic clean-water campaign allocates 100 million VND across three stages. A sponsor and an independent auditor review each request. Verified delivery opens the next stage, allowing useful work to continue with visible responsibility.

**Why TideCloak matters.** The app integrates TideCloak login and server-side access-token verification. A configured multi-admin Tide realm can govern protected role changes through QEA. Business approvals are separately enforced by the application. Local demo identities are explicitly simulated and are not evidence of live TideCloak protection.

**Prototype & storytelling.** The workspace demonstrates two-person approvals bound to a request version, replay-safe simulated payments, evidence verification and milestone sequencing. The governance view links to the real Tide Console for a pending-then-approved QEA demonstration after realm setup. All campaign records and funds are synthetic. No real transfer occurs.

## Earlier workspace preview

![Local demo after independent approvals and milestone verification](docs/workspace.png)

This screenshot shows the earlier workspace with simulated local identities. The current frontend has five tabs: Public Dashboard, Project Workspace, Approval Center, TideCloak & QEA, and Public Audit Trail. The screenshot is not evidence of live Tide authentication or QEA or a visual check of the new frontend.

![Current local simulation: signed-in auditor and role eligibility](docs/tide-simulation.png)

The current screenshot and browser walkthrough use the explicit simulated sign-in flow. Live TideCloak authentication and QEA remain separate, unverified steps.

## Run the local demonstration

Requires **Node.js 24+** and npm. The database uses Node's built-in SQLite. No Docker or Tide account is required for the explicitly simulated local mode.

```sh
npm ci
npm run demo
```

Open **http://localhost:3000**. The app starts as a public visitor. Select Project team, Sponsor, Independent auditor or Platform admin in the top bar, then click **Simulate sign-in**. Sign out before switching accounts. Demo mode binds to loopback and is refused in production. It must not be presented as real authentication or QEA.

For a clean rehearsal, stop the app and run `npm run demo:fresh`. This creates a separate database and preserves previous runs. A [Vietnamese walkthrough](docs/CHAY_DEMO_VI.md) includes exact buttons, expected results and failure cases.

1. Team: create milestone 1 funding in **Project Workspace**.
2. Sponsor: open **Approval Center** and approve. Release remains locked.
3. Auditor: approve the same request in **Approval Center**.
4. Sponsor: execute the mock payment in **Approval Center**.
5. Team: submit a short synthetic delivery note in **Project Workspace**.
6. Auditor: verify delivery in **Approval Center**. Milestone 2 opens, without an automatic payment.

## Connect live TideCloak

See **[the setup guide](docs/TIDECLOAK_SETUP.md)**. Export your public client adapter to `config/tidecloak.json`, set the roles in `config/README.md`, then:

```sh
npm run dev
```

Default authentication is TideCloak. Missing configuration never enables demo identities. Tokens are verified with the official `@tidecloak/nextjs/server` SDK plus issuer/client checks. Configuration, databases, credentials and local environment files are gitignored. Use a public OIDC client without a secret.

For production-shaped local testing, use `npm run build` followed by `npm start` with a configured realm. `AUTH_MODE=demo` is rejected by the production server.

## Verification

```sh
npm run check
npm run build
npm run doctor
```

The 27 tests cover role and membership checks, self-approval, duplicate subjects, edits, stale approvals, payment idempotency and API input/origin validation through all three milestones. Session tests cover simulated sign-in, server-owned roles, expiry, revocation and local-mode boundaries. Frontend regression tests check persisted records, failed responses without local fallback, public-role boundaries, and the absence of demo switching in live UI. Signed ES256 fixtures exercise the official verifier against tampering, wrong keys, expired/not-yet-valid tokens, wrong issuer/client and malformed claims. These fixtures use generated local keys, not a live Tide realm.

The frontend reads `/api/state`, submits campaign changes to `/api/actions`, and uses `/api/demo/session` only for explicit local simulated sign-in/out. Errors stay errors; there is no simulated-success fallback. Local account selection and abuse probes appear only in explicit demo mode. Live mode uses the official TideCloak provider and bearer tokens. The governance tab reports live QEA verification as pending rather than generating fake pending requests or denial evidence.

The [Tide integration plan](docs/TIDE_INTEGRATION_PLAN.md) records the read-only Raziel MCP calls, the role/action matrix, simulation boundaries and remaining live migration gates, including complete DPoP verification. Opaque demo sessions last 30 minutes, are revoked on sign-out and are not persisted in browser storage. The UI displays server-owned roles; selecting a persona alone grants no browser session.

## Architecture and limits

```mermaid
flowchart LR
  UI[Next.js workspace] --> API[Authenticated API routes]
  UI --> TC[TideCloak login]
  TC --> QEA[Live realm governance]
  API --> JWT[Tide SDK verification]
  JWT --> RULES[Milestone and approval rules]
  RULES --> DB[(SQLite)]
  RULES --> PAY[Simulated payment record]
```

- This MVP has one campaign. `mt_member` grants membership in that campaign; extend the membership model before adding campaigns.
- Sponsor and auditor approvals must come from distinct token subjects. A request creator cannot approve their own request. A single human's control of multiple external accounts is outside this prototype's verification.
- Request versions bind amount, recipient, purpose, milestone and policy version. This consistency hash is not a cryptographic approval signature or protection against a fully compromised database/server.
- QEA governs protected identity changes. It does **not** cryptographically authorize these mock payments. The backend and SQLite remain trusted for the spending workflow.
- The `master` realm is outside QEA. Do not claim immunity against every administrator or infrastructure compromise.
- Evidence is reviewed by an auditor; the app does not establish that an invoice or physical delivery is genuine.
- The audit log is an application log, not an immutable ledger. No Forseti signing, E2EE vault, real bank integration or blockchain is implemented.
- Live Tide login/QEA requires enrollment and realm setup. Until verified, do not describe the prototype as competition-ready or claim the live integration has passed.

## Demo and submission

See **[the two-minute script](docs/DEMO_SCRIPT.md)** and **[team work split](docs/TEAM.md)**. Record an actual `.mp4` under 100 MB and put it in `demo/demo.mp4`. The recording is not included yet. The README overview above is under 300 words; setup documentation is separate.

Challenge 2 asks for a public repository containing code and the recording, submitted through the form on [Tide UNLOCKED](https://tide.org/unlocked/#submit). Creating this repository does not submit the challenge.

## Sources

- [TideCloak Next.js integration](https://docs.tide.org/Languages/NextJS/tidecloak-nextjs-how-to-guide)
- [QEA setup](https://docs.tide.org/Admin/SetupIGA) and [governance model](https://docs.tide.org/Core-Concepts/iga-workflow)
- [Tide UNLOCKED challenge and judging](https://tide.org/unlocked/#challenge)

## License

MIT. Dependencies retain their own licenses.
