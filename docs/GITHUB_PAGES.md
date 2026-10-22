# GitHub Pages deployment

**Public URL:** https://tuankhai1210.github.io/MilestonesTrust/

Pages serves the project overview and an illustrative workflow walkthrough. The Next.js app needs API routes and SQLite; run it separately using [SETUP.md](SETUP.md). The public website has no sign-in, authorization or payment execution.

## Deployment

1. In [Pages settings](https://github.com/TuanKhai1210/MilestonesTrust/settings/pages), select **GitHub Actions**.
2. Merge website changes into **main**. **Deploy GitHub Pages** validates and deploys the public artifact.
3. Inspect [the workflow](https://github.com/TuanKhai1210/MilestonesTrust/actions/workflows/pages.yml) for the deployment URL.

The `github-pages` environment must allow `main`. Manual dispatch is supported on `main`; pull requests validate without deploying. No `gh-pages` branch or Jekyll build is needed.

## Local preview

```sh
npm run build:pages
python -m http.server 8000 --directory out-pages
```

Open http://localhost:8000. The build uses only Node's standard library and works without `npm ci`. It checks local links, assets, anchors and JavaScript syntax, then creates `out-pages/` from an explicit allowlist. Guides, configuration, databases and application source are excluded.

Assets use relative URLs, supporting `/MilestonesTrust/` without Next.js base-path configuration.

## Website files

| Path | Purpose |
| --- | --- |
| `docs/index.html` | Overview and walkthrough markup |
| `docs/site.css` | Responsive visual design |
| `docs/site.js` | Prepared illustrative story steps |
| `docs/mark.svg` | Site icon |
| `docs/tide-simulation.png` | Local application screenshot |
| `scripts/build-pages.mjs` | Validates and packages the website |
| `.github/workflows/pages.yml` | PR validation and main deployment |

Walkthrough buttons navigate prepared synthetic examples. Reload resets them. Run the Node.js app to exercise server rules and persistence.

## Troubleshooting

- **Workflow never starts:** confirm the default branch and trigger are both `main`.
- **Configure Pages fails:** select **GitHub Actions** in Pages settings.
- **Deployment blocked:** allow `main` in the environment's deployment branch policies.
- **Missing assets:** use relative URLs and run `npm run build:pages`.
- **Old version:** check the deployed commit in Actions before refreshing.

The repository's `.mcp.json` configures Raziel MCP for development. It is not a website dependency and does not configure a live realm, enroll accounts or enable QEA.

## References

- [GitHub Pages custom workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)
- [Configuring the publishing source](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
