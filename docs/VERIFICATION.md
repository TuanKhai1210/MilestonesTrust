# Verification snapshot

Performed on 22 October 2026, Windows, Node.js 24.18.0, Next.js 16.4.2 and TideCloak Next.js SDK 0.14.40.

| Check | Result |
|---|---|
| TypeScript strict check | Passed |
| Automated tests | 20 passed |
| Optimized production build | Passed |
| Production `/api/state` without adapter | 200; public synthetic records, Tide mode, configured=false |
| Forged demo header against production action API | 503; no fallback to demo identities |
| Cross-origin write | 403 |
| Dependency audit, production dependencies | 0 reported vulnerabilities at check time |
| Browser walkthrough | Team request → Sponsor approval → Auditor approval → simulated payment → Team evidence → Auditor verification → M2 opens |

The browser walkthrough used **local simulated identities**. A screenshot is stored in `workspace.png`. Automated tests cover business permissions, self-approval, duplicate subjects, revisions, stale hash rejection, idempotent payments and explicit auth-mode boundaries. API route-handler integration tests complete all three milestones, release exactly 100 million synthetic VND once per request, and reject invalid origin/content type/JSON, oversized input and wrong roles. They use a temporary database, not the running app's data.

Signed ES256 test fixtures exercise the official Tide verifier with locally generated keys: valid claims pass; altered content, another signing key, expired/not-yet-valid tokens, wrong issuer/client and malformed subject/role claims fail. These are **offline cryptographic fixtures, not tokens issued by a live Tide realm**. Malformed claims now return 401 rather than a role-parsing error or accepting a non-string subject.

**Not verified:** application login with an enrolled Tide account, token lifecycle against the application realm, live QEA pending/applied states, mobile-device interaction or a full compromise threat model. There is no configured application adapter yet. See `TIDECLOAK_SETUP.md` for the live checklist.

The two-minute MP4 is not included. This snapshot does not imply the hackathon submission is complete.

## Independent demo rehearsal

`npm run demo:fresh` was launched and checked over HTTP: `/api/state` returned 200 in explicit demo mode, zero requests/payments, M1 ELIGIBLE and M2/M3 LOCKED. A simulated platform-admin write returned 403. The command creates a separate SQLite file and retains earlier runs. See [the Vietnamese rehearsal guide](CHAY_DEMO_VI.md).

The new fresh session has not received another browser walkthrough. The Edge automation extension requested an update before it could open the demo tab. The earlier browser walkthrough and screenshot above remain the visual evidence; the new checks are HTTP, route-handler and signed-fixture checks.

## Live setup attempt on Windows

On 22 October 2026 the user requested live connection and verification, and confirmed that the server should run on this machine. Docker Desktop 4.96.1 and the official WSL 2.7.8 MSI were downloaded outside the repository; SHA256 and publisher signatures were verified. The Docker per-user installer exited with code 1: VirtualMachinePlatform is disabled. The existing WSL Store package reports `Wsl/CallMsi/Install/REGDB_E_CLASSNOTREG`; the WSL service and Program Files executable are absent.

The Administrator step and restart have since completed. Boot time is 22 October 2026 15:25:36 UTC+7; WSL 2.7.8 reports normally, its service runs and Windows no longer reports CBS RebootPending. Docker Desktop 4.96.1 installs successfully; Docker Engine 29.9.2 and Compose 5.6.0 respond. The doctor script now also finds a per-user Docker installation when the current terminal still has the old PATH.

Initial Tide container startup failed because the fresh named H2 volume was root-owned and the image runs as UID 1000/GID 0. The compose init service now sets ownership of that volume, exits 0, then starts Tide as UID 1000. The tested image is pinned to digest `3f52d0bc3e4e3ae5153e172960003bbe94705cd40af6561fd4c7c4434aaa2708`. The server publishes only `127.0.0.1:8080`; its root returns 302 and the local master-admin token endpoint returns 200. The random local bootstrap password is gitignored and is not included in these records.

**Current blocker:** the Tide Console stays on “Signing you in…” after local bootstrap sign-in. The bootstrap client and descriptor exist; a missing master `tidecloak.json` warning was observed, but no root cause has been established. Master-admin API success does not prove Tide account enrollment, application login or QEA. The user requested deferring Tide troubleshooting and continuing independent application work; no realm/license/enrollment or QEA completion is claimed.
