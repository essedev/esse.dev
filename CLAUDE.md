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
Production is not affected: built images carry a content hash.

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
  to an unpublished project. A project to hide goes to `published: false`; one that
  must not be named is deleted, since the files are public (DECISIONS #21). Which projects, how to tell them and the site's voice:
  `docs/features/progetti.md`. The repo is public and the agent reads its docs: no client
  or reserved project names in any file.
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

## Open Graph and SEO

- OG: prerendered endpoint `src/pages/og/[name].png.ts` (satori + resvg), pure layout in
  `src/lib/og.ts` (terminal style, DECISIONS #19); the prerender runs in Node for resvg.
  Satori gotchas: `woff`/`ttf` fonts, never `woff2` (Departure Mono also has the `woff` in
  `src/assets/fonts/`); sizes in `style`; colors copied from `@theme`, because satori does
  not read CSS variables; a file is read from `process.cwd()`, not from `import.meta.url`,
  which at build points to `dist/`.
- Canonical, hreflang and JSON-LD: pure helpers in `src/lib/seo.ts`.

## Design system: the workspace

The site is used like an app: list on the left, pane with its toolbar on the right (choices
in ARCHITECTURE, style and glass in DECISIONS #15-#16). Shell in
`src/layouts/Workspace.astro`, list and pager order in `src/lib/workspace.ts`, keyboard and
mobile drawer (`data-drawer`) in `src/scripts/workspace.ts`.

- The list goes in order of importance: single pages, showcase (`featured.json`, 6) with
  "tutti i N", method, writing, external profiles. The other projects are found by search.
  It must fit in 900 px of height.
- A new URL parameter is checked against those in use: `?q=` list search, `?ask=`
  pre-filled agent question.
- Navigation lives in the toolbar (breadcrumb, Esc, "‹ section" on mobile), never a "Back"
  in the content. The level above is computed from the `crumbs` in `Workspace.astro`.
- Tokens in `@theme` (`src/styles/global.css`): a hand-written value in a component is a
  mistake.
- Lavender (`accent`) for identity and interaction; green (`live`) only for "alive,
  succeeded" (LED in progress and maintained, successful copies and sends), never on
  running text.
- Glass: `glass` utility with the values in `--glass-*`, the toolbar stays flat. A blurring
  glass does not go inside another (Chromium stops blurring): the frame has only the
  border, the pane blurs from the `data-pane-glass` layer, which contains no other glass.
  The wallpaper is a continuous veil with a single point of light: scattered glows turn
  into blotches.
- On the glass only light veils: solid `bg-panel` does not show. Blocks `bg-surface/60`; a
  single scale for states: hover `surface/60`, selection `surface` (above the hover, so the
  "you are here" stays), `hover` only for controls that already start from the veil. A new
  text color is measured on the glass, where the background is lighter, not on black.
- Departure Mono for all the interface mono (code in prose stays Geist Mono), CRT veil with
  the values in `--crt-*`.
- No maximum width on the content: the column and the fluid size set the measure.
- Never native controls (`ui/Select.svelte`). Icons only Lucide. A project's logo is content,
  not a UI icon: it lives in the project's folder (DECISIONS #22, rules in
  `docs/features/progetti.md`, Images).
- Icons in motion: `data-motion="<name>"` on the Lucide icon, gesture on hover of the link,
  button or field that contains it (pointer only; a glow with reduced motion), CSS in
  `global.css`. The parts are taken by position in the path and the redrawn strokes have a
  measured length (`--len`): when updating Lucide they must be rechecked. Choices in
  concept E.
- Reduced motion removes displacement, not feedback (DECISIONS #25): what translates, rotates
  or scales gets an equivalent that stays put in the `prefers-reduced-motion` block of
  `global.css` (or `motion-safe:`); color, opacity, strokes and text changing in place keep
  running. A new animation picks its side there; never a global `animation: none`.
- A single search in the site and a single blinking cursor. Never accent lines or bars to
  the left of or above an element to indicate selection or state: selection shows from the
  background.
- No inline styles in attributes: the CSP blocks them. The page change is instant: no view
  transition.
- No bounce and no scroll passing underneath: `overscroll-none` on the main containers,
  `overscroll-x-none` on nested blocks that scroll sideways (otherwise the wheel over the
  code does not scroll the page); never a rule on `*`. `touch-action` does not pass inside
  a scrolling container: put it there too.

## Agent

- Code in `src/agent/` and `src/components/agent/`; why and how in ARCHITECTURE (Agent),
  DECISIONS #11-#14, #17-#18, #24.
- Every message to the agent in preview calls real models on OpenRouter
  (`OPENROUTER_API_KEY`) and the code tools the GitHub API (`GITHUB_TOKEN` optional). The
  E2E tests send no messages to the model: `agent-states.spec.ts` answers the socket itself
  with pi's events (`routeWebSocket`). A new state of the page is derived in `phaseOf`
  (`src/agent/phase.ts`), not with a new server event. Locally `draft_message` sends into
  wrangler's simulator (the text ends up in `.wrangler/tmp/email/`): to try it you need
  `MAIL_TO`, even a fake one (`wrangler dev --var MAIL_TO:prova@example.com`).
- Model, provider order and timeouts in `src/agent/models.ts`; existing conversations move
  to the new model when the object starts. Spending limits in `src/agent/budget.ts`
  (visitor, IP, site), per-IP burst with the `AGENT_RATE` binding. Triage in
  `src/agent/triage.ts`, Jev's transport in `JEV_TRANSPORT` of `src/agent/site-agent.ts`.
- A new tool is a pi-durable `ToolRegistration`, with `replay: 'safe'` only if rerunning it
  has no effects. Site data is read from the `/agent/index.json` index (generated at
  build), never from outside.
- Code that runs only on the Worker must be excluded from `tsconfig.json` and included in
  `tsconfig.worker.json`.
- On the Worker a `fetch` detached from its object (saved in a field) throws "Illegal
  invocation"; in Node and in tests it does not. Wrap it:
  `(input, init) => fetch(input, init)`.
- In Svelte a prop or a variable is not named like a rune (`state`, `derived`, `effect`,
  `props`): `$state(...)` becomes the subscription to a store and the page breaks at
  runtime, with no errors from `pnpm check`.

## Conventions

- `pnpm` always. Tabs, 100 columns, single quotes, no trailing comma (`.prettierrc`). The
  content Markdown is excluded from prettier.
- Tailwind 4 CSS-first, no `tailwind.config`.
- Code in English, UI in Italian with real accents. No em dash or section sign, not even
  in the content.
- Commits: Conventional Commits in English, atomic. Push only on explicit command.
- Mockups and visual variants: HTML files in `docs/concepts/`, labeled A, B, C; superseded
  ones go to `docs/archive/concepts/`.

## Do not touch without reason

- Security headers in two places to keep aligned: `public/_headers` for static assets,
  `src/middleware.ts` for the Worker's responses.
- CSP in `astro.config.mjs` (`security.csp`): a new external domain must be added there.
  `frame-ancestors` must stay in the header: in the meta tag it is ignored.
- Shiki is off (`markdown.syntaxHighlight: false`): it uses inline styles that the CSP
  blocks. If code highlighting is needed, Prism with a stylesheet.
