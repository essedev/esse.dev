# CLAUDE.md - esse.dev

Personal portfolio, main domain `esse.dev` (`site` in `astro.config.mjs`), repo
`essedev/esse.dev` (it was `simonesalerno.it`). Worker and package stay `simonesalerno`:
renaming the Worker creates a new one, without Durable Object, secrets and domain.
`simonesalerno.it` will point to `esse.dev` with a Cloudflare Redirect Rule, never in the
code (still to do: Open in the ROADMAP). Astro 7 + strict TS + Tailwind 4, Svelte 5
islands, deployed on Cloudflare Workers; a page is an agent (Durable Object with
pi-durable, models from OpenRouter). The why of the choices is in `docs/ARCHITECTURE.md`
and `docs/DECISIONS.md`; state and log in `docs/ROADMAP.md` and `docs/CYCLES.md`.

Public repository: code, comments, docs and commits in English; README.md is mirrored in
README.it.md in the same commit. Language rules and glossary in `docs/CONVENTIONS.md`.

## Commands

- `pnpm dev` - Astro dev server on :4321.
- `pnpm build` - static build + Worker in `dist/`.
- `pnpm preview` - build and `wrangler dev` on :8787 (production behavior).
- `pnpm check` - astro check plus `tsc -p tsconfig.worker.json` (the Worker code has the
  Cloudflare runtime types, which clash with the DOM ones).
- `pnpm lint` - prettier --check, eslint (doc comments required on the exports of `src/lib`
  and `src/agent`) and `scripts/check-prose.py` (Italian outside the paths in `.prose-allow`;
  README pair aligned). `pnpm format` to write.
- `pnpm test:unit` - Vitest. `pnpm test:e2e` - Playwright. `pnpm test:ci` - both.
- `pnpm eval:jev` - evaluates the agent's triage on `tests/eval/jev-triage.json` (real
  calls via OpenRouter, after a build; outside `test:ci`). Rerun if questions, thresholds
  or the Jev version change.
- `pnpm favicons` - regenerates the favicons in `public/` from
  `scripts/generate-favicons.ts`.
- `pnpm generate-types` - regenerates `worker-configuration.d.ts` after every change to
  `wrangler.jsonc`.
- `pnpm deploy` - build + wrangler deploy.

Quality gate before a non-trivial commit and ALWAYS before a push:
`pnpm lint && pnpm check && pnpm build && pnpm test:ci`. There is no remote CI: the deploy
happens via Cloudflare Workers Builds on push, the gate is local.

The E2E tests run against the build served by `wrangler dev` on :8788, not against the dev
server: redirects, headers, CSP, 404 and the Durable Object exist only there. Playwright
rebuilds and starts its own server every time. Every build rewrites `dist/` under a running
`wrangler dev`: the preview on :8787 answers 404 until you restart it (also after the E2E
tests). An orphan `workerd` on one of these ports serves old assets: close it. Likewise
`pnpm check` rebuilds the Vite cache (`node_modules/.vite`) under a running `pnpm dev`: the
Svelte islands stop hydrating (404 on dependencies, then "reading 'call'") until you stop
it, delete the cache and restart it.
Replacing an image file keeps the old one on screen in dev: the image endpoint answers
`immutable` and wrangler's emulated cache (`.wrangler/state/v3/cache`) keys it by URL, not by
content. Stop the dev server, delete that folder, restart, and hard-reload the browser.
Production is not affected: built images carry a content hash. An edited `meta.json` can
stay invisible in dev even after a restart: delete `.astro/data-store.json` and
`node_modules/.astro/data-store.json`.

Secrets in `.dev.vars` (excluded from git, template in `.dev.vars.example`), read by
`wrangler dev` and copied into `dist/server/` by the build; in production
`wrangler secret put`.

## Content

- One folder per item in `src/content/{projects,articles,method,now}/`, with `meta.json`
  (shared fields) and `<lang>.md` (translated frontmatter and body). Single pages
  (welcome, about, contact) in `src/content/pages/<page>/<lang>.md`.
- Schemas in `src/content.config.ts`: a new field is added only there, the types come from
  `CollectionEntry`.
- `src/lib/content.ts` is the only access to content. It joins meta and text and fails the
  build if a language is missing, a text has no meta, a slug repeats or the showcase points
  to an unpublished project. A project to hide goes to `published: false`; one that must not
  be named is deleted, since the files are public (DECISIONS #21). Which projects, how to
  tell them and the site's voice: `docs/features/progetti.md`. The repo is public and the
  agent reads its docs: no client or reserved project names in any file.
- Site texts and UI strings: `site` collection (`src/content/site/<lang>.json`), read with
  `getSite(lang)` and `translator(lang)` from `src/lib/site.ts`. Strict schema: a new key
  goes in the schema and in every language, and becomes a type (`UiKey`).
- Configuration in `src/config/` (languages, routes per language, showcase), validated on
  import by `src/lib/config.ts`.
- Astro's standard where it exists (collections, `@astrojs/rss`, Fonts API). The sitemap is
  hand-written: `@astrojs/sitemap` does not know the translated slugs.
- `/llms.txt` (`src/pages/llms.txt.ts`) is built from the same collections as the sitemap, in
  the default language: a new section or collection goes in both.
- In Markdown commands go in backticks: Astro's typography turns `--` into a long dash
  outside code.

## i18n and routing

- Pages: `src/pages/[lang]/index.astro`, `[lang]/[section]/index.astro` (sections),
  `[lang]/[section]/[slug].astro` (details). `section` is the localized route (`progetti`,
  `writing`...); the logical sections are in `SECTIONS` of `src/lib/i18n.ts`.
- The logic is in pure functions in `src/lib/i18n.ts` (`sectionOf`, `routeOf`,
  `translateSlug`, `getLanguageUrl`, `resolveRedirect`): do not reimplement it inline. The
  routes of earlier versions (`blog`, `informazioni`) go through `LEGACY_ROUTES`.
- Only `src/pages/index.ts` (language from `Accept-Language`), `src/pages/[...path].astro`
  (redirect to the canonical URL or 404 with suggestions), `src/pages/500.astro` and
  `/agents/site-agent/*` (the agent, dispatched by `src/worker.ts`) run on the Worker.
  Everything else is static.

## SEO

- Canonical, hreflang and JSON-LD: pure helpers in `src/lib/seo.ts`. The OG images have their
  rule (below).

## Worker

- Code that runs only on the Worker must be excluded from `tsconfig.json` and included in
  `tsconfig.worker.json`.
- On the Worker a `fetch` detached from its object (saved in a field) throws "Illegal
  invocation"; in Node and in tests it does not. Wrap it:
  `(input, init) => fetch(input, init)`.

## Rules by path

They load when a matching file is read; the rest of this file holds for every file.

- `.claude/rules/workspace-ui.md`: the design system (shell, tokens, themes, glass, icons,
  motion), for components, layouts, styles, scripts, pages and concepts.
- `.claude/rules/agent.md`: the agent (models, budget, tools, its tests).
- `.claude/rules/og.md`: the Open Graph images and satori's gotchas.

## Conventions

- Tabs, 100 columns, single quotes, no trailing comma (`.prettierrc`). The content Markdown
  is excluded from prettier.
- No em dash or section sign, not even in the content Markdown.
- Mockups and visual variants: HTML files in `docs/concepts/`, labeled A, B, C; superseded
  ones go to `docs/archive/concepts/`.

## Do not touch without reason

- Security headers in two places to keep aligned: `public/_headers` for static assets,
  `src/middleware.ts` for the Worker's responses.
- CSP in `astro.config.mjs` (`security.csp`): a new external domain must be added there.
  `frame-ancestors` must stay in the header: in the meta tag it is ignored.
  Astro hashes the scripts it bundles, not an `is:inline` one: an inline script gets its hash
  in `scriptDirective.hashes`, computed from its file as `theme-init.js` does.
- Shiki is off (`markdown.syntaxHighlight: false`): it uses inline styles that the CSP
  blocks. If code highlighting is needed, Prism with a stylesheet.
