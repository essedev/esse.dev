# simonesalerno.it

Personal portfolio of Simone Salerno, online at [esse.dev](https://esse.dev). Built with Astro and deployed on Cloudflare Workers. The repository keeps its historical name.

## Tech stack

- **Astro 7** - static pages, with Svelte 5 islands where interaction is needed
- **Tailwind CSS 4** - styling, plus the typography plugin for Markdown content
- **Content collections** - projects and articles as `meta.json` + Markdown per language, validated with Zod
- **Cloudflare Workers** - static assets plus a small Worker for language detection, redirects and the site agent
- **Site agent** - pi-durable on a Durable Object per visitor (Cloudflare Agents SDK), models through OpenRouter
- **TypeScript** (strict), **Vitest** and **Playwright**

## Features

- English and Italian with translated routes and slugs, canonical redirects and hreflang
- The site as a workspace: a list on the left (pages, project showcase, method, writing), the content pane with its toolbar on the right, keyboard navigation
- Home with a short intro, contacts and where to start: the agent, a lead project, the method
- Project and article listings with search, tag, status and sort filters kept in the URL
- Article reading time and token estimate, related articles
- Per-language RSS feed, sitemap with alternates, JSON-LD
- Open Graph images generated at build time, one per page
- A site agent that answers from the site's own pages and the public code of the projects, and shows its tool calls, tokens and cost, behind a triage step and a real-cost daily budget

## Development

Requires Node 22.12+ and pnpm.

```bash
pnpm install
pnpm dev          # dev server on :4321
pnpm build        # static build + Worker in dist/
pnpm preview      # build and serve with wrangler on :8787
```

The agent needs `OPENROUTER_API_KEY`, reads code on GitHub better with an optional
`GITHUB_TOKEN`, and sends approved drafts with `TURNSTILE_SECRET` and `MAIL_TO`: copy
`.dev.vars.example` to `.dev.vars` locally, `wrangler secret put` in production.

Quality gate, run before every push:

```bash
pnpm lint && pnpm check && pnpm build && pnpm test:ci
```

## Documentation

- [`CLAUDE.md`](CLAUDE.md) - conventions, commands and gotchas (for the coding agent)
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) - design decisions and tradeoffs
- [`docs/DECISIONS.md`](docs/DECISIONS.md) - durable decisions, citable as `#N` (inactive ones in [`docs/decisions-archive.md`](docs/decisions-archive.md))
- [`docs/ROADMAP.md`](docs/ROADMAP.md) - current milestones
- [`docs/CYCLES.md`](docs/CYCLES.md) - work-cycle log
- [`docs/archive/RESTYLE.md`](docs/archive/RESTYLE.md) - history of the visual identity work

## Deployment

Cloudflare Workers Builds deploys on push. Manual deploy: `pnpm deploy`.

## License

Private personal website.
