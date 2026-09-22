# simonesalerno.it

Personal portfolio website built with SvelteKit and deployed on Cloudflare Workers.

## Tech Stack

- **SvelteKit 2** - Full-stack framework with Svelte 5 (runes)
- **Tailwind CSS 4** - Utility-first styling
- **Cloudflare Workers** - Edge deployment with global CDN
- **TypeScript** - Type-safe development
- **Vite** - Fast development and build tooling

## Features

- **Multi-language support** - Internationalization with dynamic routing
- **Portfolio showcase** - Curated home showcase, project cards plus a one-line index for archived work and ideas, detail pages
- **Articles/Blog** - One-line article index, reading time, token estimate and related posts
- **Filtering & search** - Search, tags, status and date filters (articles paginated)
- **RSS feed** - Per-language blog feed
- **Contact** - Email and social links
- **Optimized images** - Automatic image optimization with vite-imagetools
- **OG images** - Open Graph images pre-generated at build time (static PNGs)
- **Favicons** - Full favicon/manifest set generated from one drawing (`pnpm generate-favicons`)
- **Responsive design** - Mobile-first approach

## Development

### Prerequisites

- Node.js 18+
- pnpm 10+

### Getting Started

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev
```

The site will be available at `http://localhost:5173`

### Available Scripts

```bash
pnpm dev              # Start development server
pnpm build            # Build for production
pnpm preview          # Preview production build locally
pnpm check            # TypeScript type checking
pnpm lint             # Check code style
pnpm format           # Format code with Prettier
pnpm test:unit        # Unit tests (Vitest)
pnpm test:e2e         # End-to-end tests (Playwright)
pnpm test:ci          # Unit + E2E
pnpm generate-favicons # Regenerate favicons + manifest icons (outputs committed)
```

## Documentation

- [`CLAUDE.md`](CLAUDE.md) - conventions, commands and gotchas (for the coding agent)
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) - design decisions and tradeoffs
- [`docs/DECISIONS.md`](docs/DECISIONS.md) - durable decisions, citable as `#N`
- [`docs/RESTYLE.md`](docs/RESTYLE.md) - visual identity direction ("Laboratorio" restyle)
- [`docs/ROADMAP.md`](docs/ROADMAP.md) - current milestones
- [`docs/CYCLES.md`](docs/CYCLES.md) - work-cycle log

## Deployment

The site is deployed on Cloudflare Workers for global edge performance.

```bash
# Build and deploy to Cloudflare
pnpm deploy

# Preview Cloudflare build locally
pnpm preview
```

### Environment Setup

Configure Cloudflare Workers settings in `wrangler.jsonc`.

## Project Structure

Content lives as JSON in `src/lib/content/`, validated by Zod schemas in
`src/lib/schemas/`; pure logic (content loader, i18n routing, SEO, OG) in
`src/lib/utils/`; multi-language routes under `src/routes/[page=lang]/`; build scripts
in `scripts/`; tests in `tests/unit` and `tests/e2e`. Run `tree src -d -L 3` for the
current layout, and see [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the
boundaries.

## License

Private personal website.
