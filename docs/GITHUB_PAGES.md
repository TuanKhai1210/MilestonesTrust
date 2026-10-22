# EverTrust GitHub Pages — setup and deployment

This directory contains EverTrust's **static project overview**, not the Next.js application. The application has API routes, TideCloak authentication and SQLite and therefore cannot be run as a working app on GitHub Pages. Keep sign-in and spending actions in the Node.js application.

## Files

| File | Purpose |
| --- | --- |
| `docs/index.html` | Responsive public project overview (static page). |
| `docs/.nojekyll` | Prevents Jekyll processing of site files. |
| `.github/workflows/pages.yml` | Deploys the `docs/` directory whenever it changes on `evertrust_main`. |
| `.mcp.json` | Tide's Raziel MCP configuration for a compatible AI coding agent; this does **not** configure a TideCloak realm or enable QEA. |

## Enable GitHub Pages

1. Commit and push these new files to the existing branch `evertrust_main`.
2. Open `https://github.com/TuanKhai1210/evertrust/settings/pages`.
3. Under **Build and deployment → Source**, choose **GitHub Actions**.
4. Go to **Actions → Deploy EverTrust GitHub Pages**. Select **Run workflow** on `evertrust_main` if the initial deployment did not start when you pushed.
5. Once deployment succeeds, visit `https://tuankhai1210.github.io/evertrust/` (the expected default URL; confirm it in Settings → Pages).

The existing `.github/workflows/ci.yml` continues to run the application checks independently. No `gh-pages` branch is required. If GitHub Pages environment rules block `evertrust_main`, ask a repository administrator to allow that branch in **Settings → Environments → github-pages**.

## Local preview

From the repository root, run a static file server in the `docs/` directory (using Python if available):

```powershell
cd docs
python -m http.server 8000
```

Open `http://localhost:8000`. This previews only the marketing/overview page. It cannot sign users into TideCloak or access the real app's server endpoints.

## Tide MCP for development (not for GitHub Pages runtime)

The `.mcp.json` file follows Tide's official Raziel MCP example:

```json
{
  "mcpServers": {
    "tide-pack": {
      "command": "npx",
      "args": ["-y", "@tideorg/mcp"]
    }
  }
}
```

Open the repository in a compatible MCP-enabled agent and enable its project configuration. MCP availability depends on the client. Raziel helps **plan** an integration; it does not automatically grant live authentication, enroll accounts, or prove QEA. Do not commit tokens, passwords or `config/tidecloak.json`.

## Submission honesty checklist

- Clearly distinguish the static website from the running Node.js demo.
- Label synthetic identities, synthetic evidence and simulated payments as such.
- Keep live TideCloak/QEA marked **unverified** until real checks pass.
- Record the official demonstration separately; GitHub Pages is not a substitute for the competition submission form.

## References

- [GitHub Pages — custom workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)
- [GitHub Pages — publishing source](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
- [Tide Raziel MCP configuration](https://github.com/tide-foundation/raziel-mcp)
