# Connect and verify TideCloak

This guide is the remaining live integration work. Local demo success is not a live Tide verification result.

## 1. Start or obtain a TideCloak server

If Docker installation is blocked by a disabled VirtualMachinePlatform feature or a WSL registration error, follow [the Windows setup steps](WINDOWS_SETUP_VI.md) first. These prerequisites have now passed on the development machine; the remaining blocker is the Tide Console bootstrap sign-in. See [the verification snapshot](VERIFICATION.md) for the latest observed state.

If Docker Desktop is installed and running, from PowerShell:

```powershell
$env:TIDECLOAK_BOOTSTRAP_PASSWORD = Read-Host 'Local development bootstrap password'
docker compose up -d
```

The compose file binds port 8080 to `127.0.0.1`. The password stays in your process environment, not in the repository. Open `http://localhost:8080`.

The compose file pins the tested image digest. A network-isolated, read-only one-shot init container sets ownership of the named H2 volume for UID 1000; the Tide server then runs as that non-root user. This fixes the access-denied failure observed with a fresh root-owned named volume.

On this development machine a random bootstrap password was already saved in the gitignored `data/.env.tidecloak.local`. Reuse it with `docker compose --env-file data/.env.tidecloak.local up -d`. Do not replace it with a different password and assume an initialized database's administrator password has changed. Never commit or record that local file. Open a new terminal after installing Docker so the Docker CLI and credential helper are both on PATH.

An image is not a configured Tide realm. Follow the official [Quickstart](https://docs.tide.org/get-started/Tidecloak%20Quickstart) to provision a realm/client, activate the dev license and enroll the first administrator. You can run the initializer in a **separate temporary project** and copy the public adapter export to this project's `config/tidecloak.json`; do not run an initializer over this existing source tree.

```powershell
# Run in a separate parent directory, not inside milestone-trust:
npm init @tidecloak/nextjs@latest tide-setup
```

Complete the enrollment link yourself when prompted. Any agreement/account enrollment is a user step. Do not commit account links, passwords, tokens or an adapter with a client secret.

## 2. Configure the client and participants

- Public client, authorization-code flow. Client adapter needs realm, server URL, resource/client ID and its verification keychain exported by Tide.
- Redirects `http://localhost:3000/*`; web origin exactly `http://localhost:3000`.
- Add roles and assign independent enrolled accounts according to `config/README.md`.
- This prototype uses bearer access tokens and does not enable DPoP. Do not enable DPoP on the client without implementing the matching proof/verification flow.
- Restart `npm run dev` and use **Sign in with TideCloak**. Confirm `/api/state` with the SDK token returns the verified subject and roles.
- The app denies a token from a different realm/client. It ignores demo headers in Tide mode. It requires `mt_member` plus the action role.

## 3. Configure live QEA

Follow the official [QEA recipe](https://docs.tide.org/Admin/SetupIGA). Enroll **three** separate `tide-realm-admin` accounts. According to the [documented formula](https://docs.tide.org/Core-Concepts/iga-workflow), three admins need two approvals; two admins need only one.

1. In the application realm's Tide Console, propose adding `mt_sponsor` to a test account.
2. Review and approve with one realm admin. Capture the actual change request and below-quorum state.
3. Refresh/re-login as the target account. Check the newly requested role is not effective yet.
4. Approve with the second independent realm admin. Capture the applied change.
5. Refresh/re-login and verify the new token/role can perform its intended allowed action.

Use the application realm, not `master`. Keep realm-admin governance separate from sponsor/auditor spending approvals. Record actual UI/API results, never a frontend imitation of a pending QEA change.

## 4. Live integration checklist

- [ ] Server reachable and app realm/license/enrollment complete.
- [ ] Adapter exported, login, refresh, logout and callback tested.
- [ ] Valid token passes; malformed, expired and wrong-client tokens fail.
- [ ] Team/Sponsor/Auditor/Admin API permissions match their roles.
- [ ] Requester and two approvers are distinct subjects.
- [ ] Three realm admins enrolled; single approval leaves protected change pending.
- [ ] Second approval applies protected change; fresh token reflects it.
- [ ] Video clearly separates backend approvals, QEA governance and simulated payment.

These boxes are intentionally unchecked until the team verifies them on a live realm.
