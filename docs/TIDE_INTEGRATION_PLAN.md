# TideCloak integration plan and local simulation

22 October 2026. App: MilestoneTrust, repository: Evertrust.

## Guidance actually consulted

Called Tide's public Raziel MCP at `https://mcp.tide.org/mcp` over the Model Context Protocol, using `initialize`, `tools/list`, and `tools/call`. The server identified itself as **@tideorg/mcp 1.9.33**. This was a direct read-only MCP connection, not an installed Codex plugin and not a connection to the team's realm.

At 09:33 UTC, called:

- `tide_choose_playbook`: existing Next.js relief app, plan authentication/roles/API protection/QEA, explicitly simulate while the realm is unavailable.
- `tide_playbook`: `protect-api-nextjs` and `add-rbac-nextjs`.
- `tide_canon`: `ux-states` and `iga-change-requests-api`.

Read-only calls can be repeated with `scripts/tide-guidance.mjs`. It sends the supplied planning arguments only, never repository files or credentials. For example:

```powershell
node scripts/tide-guidance.mjs tide_playbook '{"name":"add-rbac-nextjs"}'
```

Provider reference: [Raziel / Tide MCP](https://tide.org/agent-plugins).

The returned deployment work order contains realm creation, licence, hosting and enrollment steps. Those steps are outside the current simulation request and have not been executed. No legal agreement was accepted and no licence email was invented.

## Where Tide fits

| Boundary | Local simulation now | Real Tide integration later |
|---|---|---|
| Sign in | Select a synthetic account, explicitly click Simulate sign-in; backend issues an opaque 30-minute demo session | Official TideCloak provider and the user's enrollment/login ceremony |
| Identity | Server resolves the demo session into a stable synthetic `sub` | Server verifies the Tide token against the complete adapter's embedded keychain and issuer/client/time claims |
| Roles | Server-owned account role list; caller-supplied roles are ignored | Signed realm/client roles, restricted to the application's known role set |
| API access | `/api/actions` authenticates every write; missing session 401, wrong role 403 | Replace the identity source with verified Tide claims; keep all business checks server-side |
| Logout / expiry | DELETE revokes the opaque token; expiry or server restart invalidates it | SDK logout, refresh lifecycle, expired-session and offline states |
| Governance | Explanatory view and current role eligibility; no manufactured QEA records | Protected role changes in the real realm; test pending below quorum, committed after quorum, and a fresh token with the new roles |
| Money / milestones | SQLite transaction rules and synthetic payment records | Application/payment-provider rules remain separate from Tide identity governance |

The browser starts as a public visitor. Selecting a persona does not authenticate it. A successful simulated sign-in must reach the backend before the UI receives roles. Tokens are held only in browser memory, never persisted in localStorage; reloading requires another simulated sign-in. The local session map is also in memory and is not a production session service.

`AUTH_MODE=demo` is explicit, loopback-only and rejected in production. Default `AUTH_MODE=tidecloak` never falls back to simulation. The `x-demo-role` header remains a deliberate local test probe for existing API tests and clearly labeled abuse buttons; it is not used by the normal browser session flow and is never accepted as identity in live mode.

## Roles and business rules

All campaign actors require `mt_member` plus the action role.

| Actor | Role | Allowed actions | Additional checks |
|---|---|---|---|
| Public visitor | None | View synthetic campaign and public application log | Cannot write |
| Project team | `mt_team` | Request funding, revise own unpaid request, submit evidence | Eligible stage, exact allocation, ownership; revisions clear approvals |
| Sponsor | `mt_sponsor` | Approve as sponsor, execute mock payment | Current hash; not the requester; two distinct people must approve before payment |
| Auditor | `mt_auditor` | Approve as auditor, verify delivery | Current hash; distinct from sponsor; payment and submitted evidence required |
| Platform admin | `mt_admin` | No spending or delivery-verification rights by virtue of being admin | Cannot impersonate a funding approver |

Approval collection and mock payment remain separate actions. Verification opens the next stage; it never automatically pays it. The UI's eligibility table is guidance only. The server checks the actual request state, identity and policy on every write.

## Live migration gates

1. Restore the real realm setup only when the user resumes that work. Obtain any required licence email and terms acceptance from the user; never infer them. Preserve the existing local-hosting choice unless the user changes it.
2. Use a complete exported public-client adapter including its trusted keychain. Keep credentials and adapter files out of Git. Do not add remote-JWKS fallback or trust decoded claims without verification.
3. Revisit the **complete DPoP flow** with the current SDK and Tide's canonical asset/playbook. Existing bearer-token plumbing is not proof of DPoP protection. Copy canonical relay assets and verify the matching client and server behavior; do not invent a proof protocol. This has not been implemented or verified by this simulation change.
4. Configure independent real team/sponsor/auditor identities. Verify missing/invalid/expired tokens, wrong issuer/client, missing membership and wrong roles through actual HTTP requests.
5. Configure QEA for protected identity changes. The MCP describes `/iga/change-requests/...`; its unified `/approve` lane may require an enclave ceremony and auto-commit at quorum. Read actual pending requests and effective signed policy. Do not assume that an admin count alone proves the live threshold, or call toggle-IGA as an idempotent enable action.
6. Test one protected role change below quorum and after quorum, then inspect a fresh login/token. A business-request approval is not a QEA approval.
7. Before real personal data, separate public aggregates from private evidence and apply participant/record-level checks to private reads. The current dataset is synthetic and publicly readable by design. No end-to-end encryption is claimed.
8. Verify login/logout/refresh and the whole product in a browser; record live evidence separately from simulation. Only then update the README/video claims.

QEA alone does not make the application's SQLite records immutable and does not stop a compromised backend from rewriting its own mock payments. Stronger signing/payment guarantees would require an independently enforced authorization boundary, such as a separately designed policy-governed signing integration, and separate verification.

## Acceptance checks for this stage

- Signed-out users receive no campaign roles and protected writes return 401.
- Synthetic sign-in returns server-defined roles, not roles posted by the browser.
- Team can create an eligible request; platform admin cannot.
- Tampered, unknown, expired and revoked demo sessions fail closed, even alongside a role-probe header.
- Independent sponsor/auditor, version binding, replay-safe payment and sequencing tests continue to pass.
- Live mode and production cannot use the simulation endpoint.
- The interface says simulation explicitly and presents no fake Tide/QEA success evidence.
