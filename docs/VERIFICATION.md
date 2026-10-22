# Verification snapshot

Performed on 22 October 2026, Windows, Node.js 24.18.0, Next.js 16.4.2 and TideCloak Next.js SDK 0.14.40.

| Check | Result |
|---|---|
| TypeScript strict check | Passed |
| Automated tests | 9 passed |
| Optimized production build | Passed |
| Production `/api/state` without adapter | 200; public synthetic records, Tide mode, configured=false |
| Forged demo header against production action API | 503; no fallback to demo identities |
| Cross-origin write | 403 |
| Dependency audit, production dependencies | 0 reported vulnerabilities at check time |
| Browser walkthrough | Team request → Sponsor approval → Auditor approval → simulated payment → Team evidence → Auditor verification → M2 opens |

The browser walkthrough used **local simulated identities**. A screenshot is stored in `workspace.png`. Automated tests cover business permissions, self-approval, duplicate subjects, request revision invalidation, stale hash rejection, allocation constraints, idempotent payments and explicit auth-mode boundaries.

**Not verified:** live TideCloak login, token lifecycle against a real realm, live QEA pending/applied states, Docker compose execution, mobile-device interaction or a full compromise threat model. Docker and a configured adapter were absent on the development machine. See `TIDECLOAK_SETUP.md` for the live checklist.

The two-minute MP4 is not included. This snapshot does not imply the hackathon submission is complete.

## Live setup attempt on Windows

On 22 October 2026 the user requested live connection and verification, and confirmed that the server should run on this machine. Docker Desktop 4.96.1 and the official WSL 2.7.8 MSI were downloaded outside the repository; SHA256 and publisher signatures were verified. The Docker per-user installer exited with code 1: VirtualMachinePlatform is disabled. The existing WSL Store package reports `Wsl/CallMsi/Install/REGDB_E_CLASSNOTREG`; the WSL service and Program Files executable are absent.

The current shell is not elevated. `scripts/enable-windows-wsl.ps1` is prepared for an Administrator to enable the feature without automatic restart and install the signed WSL MSI if its service/executable are missing. Its PowerShell syntax and Git whitespace check passed. **The system-changing script has not run and its installation effects are not verified.** Follow [the Vietnamese Windows instructions](WINDOWS_SETUP_VI.md), save work and restart Windows if required, then resume the live checklist. No live login or QEA result has passed yet.
