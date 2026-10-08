# esse.dev

**English** · [Italiano](README.it.md)

Personal portfolio of Simone Salerno, online at [esse.dev](https://esse.dev). Built with Astro and deployed on Cloudflare Workers.

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
- Per-language RSS feed, sitemap with alternates, JSON-LD, `llms.txt`
- Open Graph images generated at build time, one per page
- Dark and light theme: it follows the system until the visitor picks one with the toggle in the toolbar
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

## Structure

- `src/pages/` - routes: `[lang]/` for the static pages, plus the few that run on the Worker
- `src/content/` - projects, articles, method, now and single pages, one folder per item
  with `meta.json` and one Markdown file per language
- `src/agent/` - the site agent: Durable Objects, tools, budget and triage
- `src/lib/` - pure logic (content, i18n, SEO, listing filters, Open Graph layout)
- `src/components/`, `src/layouts/`, `src/scripts/` - UI: Astro and Svelte components, the
  workspace shell and its keyboard handling
- `docs/` - architecture, decisions, roadmap and the work-cycle log

## Documentation

- [`CLAUDE.md`](CLAUDE.md) - conventions, commands and gotchas (for the coding agent)
- [`docs/CONVENTIONS.md`](docs/CONVENTIONS.md) - language, glossary and code rules
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) - design decisions and tradeoffs
- [`docs/DECISIONS.md`](docs/DECISIONS.md) - durable decisions, citable as `#N` (inactive ones in [`docs/decisions-archive.md`](docs/decisions-archive.md))
- [`docs/ROADMAP.md`](docs/ROADMAP.md) - current milestones
- [`docs/CYCLES.md`](docs/CYCLES.md) - work-cycle log
- [`docs/features/progetti.md`](docs/features/progetti.md) - how projects are chosen and written up
- [`docs/archive/RESTYLE.md`](docs/archive/RESTYLE.md) - history of the visual identity work

## Deployment

Cloudflare Workers Builds deploys on push. Manual deploy: `pnpm deploy`.

## License

The code is released under the [MIT License](LICENSE). The content of the site (everything
under `src/content/`, images, favicons and the visual identity) is all rights reserved, and
the third-party font in `src/assets/fonts/` keeps its own licence.
