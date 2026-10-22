# TideCloak adapter

Export the **public-client** TideCloak adapter after creating your application realm and client. Save it here as `tidecloak.json` (gitignored). The app needs the complete exported configuration including its trusted keychain, not a guessed realm URL or a client secret.

Set exact redirect URIs `http://localhost:3000/*` and web origin `http://localhost:3000`. Configure a public client, standard authorization-code flow, and no client secret. The SDK manages login/refresh. This prototype uses bearer access-token verification, not DPoP.

Realm roles for this single campaign:

| Account | Roles |
|---|---|
| Project team | `mt_member`, `mt_team` |
| Sponsor | `mt_member`, `mt_sponsor` |
| Independent auditor | `mt_member`, `mt_auditor` |
| Platform admin | `mt_member`, `mt_admin` |

Use different account subjects for team, sponsor and auditor. Admin alone cannot approve, pay, or verify evidence. Roles are verified from signed tokens, never from an action body.

Create **three independent `tide-realm-admin` accounts** separately. QEA's documented threshold for three admins is two; two admins only requires one. Follow `docs/TIDECLOAK_SETUP.md` to verify live pending/committed changes. This application does not impersonate a Tide administrator or manufacture QEA approvals.
