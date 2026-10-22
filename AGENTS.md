<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## MilestoneTrust project rules

- Keep simulated development identities explicit and disabled in production. Never fall back from TideCloak to demo authentication.
- Enforce actor identity, campaign membership, distinct approvers and request-version binding in server code. UI checks are not authorization.
- QEA governs protected identity changes, not this prototype's payment records. Do not manufacture live Tide test results or claim resistance to a compromised application server/database.
- Keep adapter files, credentials, real user records and databases out of Git. Do not put management tokens or client secrets in browser configuration.
- Run `npm run check` and `npm run build` for affected code. Live enrollment and QEA require the team's configured Tide realm.
