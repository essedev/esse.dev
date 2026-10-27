# Architecture

The why behind this project's choices. For the current state see `docs/ROADMAP.md`, for
the cycle log `docs/CYCLES.md`.

## What it is

A personal portfolio at `esse.dev`, in Astro (strict TS, Tailwind 4, Svelte 5 islands) on
Cloudflare Workers. File-based content in the repo, EN/IT i18n with translated routes and
slugs, Open Graph images generated at build. Until Cycle 10 it was SvelteKit: the rewrite
is in `docs/archive/CYCLES-11-12.md` (Cycle 11) and the choice in `docs/DECISIONS.md` #10.

## Rendering: static, with three exceptions on the Worker

Every page is prerendered at build and served by Cloudflare as a static asset. The Worker
only receives what is not a file:

- the root `/` (`src/pages/index.ts`), which picks the language from `Accept-Language`;
- the catch-all `src/pages/[...path].astro`, which for a URL with the wrong language,
  route or slug makes a single permanent (301) redirect to the canonical one (`resolveRedirect` in
  `src/lib/i18n.ts`) and otherwise answers 404 with the localized page, which suggests
  the pages closest to the wrong path (`src/lib/suggest.ts`), the list search and the agent;
- `/agents/site-agent/*`, the agent's WebSocket (below).

When a route on the Worker throws, Astro renders `src/pages/500.astro` (not prerendered):
it logs the error with Cloudflare's `cf-ray` id and shows the visitor only that id.

The Worker entry is `src/worker.ts`: it sends only `/agents/site-agent/*` to
`routeAgentRequest` and everything else to the Astro handler, and it exports the two
Durable Objects (`SiteAgent` and `Ledger`). The path filter is there because
`routeAgentRequest` would route any exported class, and `Ledger` must stay reachable only
through RPC.

The prerender runs in Node (`prerenderEnvironment: 'node'`) because the OG images use
resvg, which is native. The E2E tests run against the build served by `wrangler dev`, not
the dev server, so redirects, headers and 404s are the production ones.

## Content: files in the repo, no DB or CMS

Each project and article is a folder in `src/content/`: a `meta.json` with the fields
shared across languages (status, dates, links, published) and one `<lang>.md` per
language (frontmatter with slug, title, excerpt, tags and, for projects, the earlier
iterations in `previously`, #20; body in Markdown). The two halves are separate content
collections (`src/content.config.ts`, Zod schemas) and are joined in `src/lib/content.ts`,
the single access point to content for pages and endpoints. That is where the build
enforces the rules the schema cannot see: a published item has its text in every
language, every text has its meta, slugs are unique per language, the showcase
(`src/config/featured.json`) points to published projects. A violation fails the build.

Why two files per item: `meta.json` holds the facts, `<lang>.md` the prose. The facts are
shared across languages (copying them into every Markdown would make them diverge) and
are the ones a script can update from the sources (repo, dates, status) without touching
hand-written text. Astro's standard would be one Markdown per language with all the
frontmatter: it costs duplication, and grows with every shared field (cover and logo, #22).

The single pages (welcome, about, contacts, privacy) are Markdown per language in
`src/content/pages/`. The welcome page keeps its text in the frontmatter, without a body:
the headline (`*...*` marks the accent) and the introduction, where `{tools}` places the
logos of the projects listed in `tools`, are composed with components, which Markdown
cannot do. The home's method card shows the `quote` of the first note that has one (#30).
The site title, section names and UI strings are the `site` collection, with a strict
schema: every language has all the keys and none extra, and the keys are a type. Config
(languages, routes, showcase) stays JSON, imported and validated by `src/lib/config.ts`,
because it is configuration and not content.

Where Astro has a standard, that is used: content collections, `@astrojs/rss`, the Fonts
API for self-hosted fonts with preload and tuned fallbacks. The sitemap is not:
`@astrojs/sitemap` derives the alternates by replacing the language prefix and with
translated slugs it would get the hreflang wrong. Opened in a browser it reads as a page:
an `xml-stylesheet` instruction points to `/sitemap.css`, CSS applied to the XML and not
XSLT, which Chrome removes. That stylesheet is a prerendered endpoint that reads the color
tokens of both themes out of `global.css` (light from the system's preference, since the
toggle cannot reach an XML document) and takes Departure Mono's URL from the Fonts API, so
no color is copied and no font file is duplicated.

## i18n: translated routes and slugs, pure logic

Two languages and full control of the URLs (`/en/projects/x` against `/it/progetti/y`)
make a library oversized, and Astro's i18n does not translate segments or slugs. The
routes per language are in `src/config/navigation.json`; the slug map (id -> language ->
slug) is derived from the content. All the logic (section of a route, translation of
route and slug, equivalent URL in another language, redirect to the canonical one,
preferred language) is in pure functions in `src/lib/i18n.ts`, unit-tested and used by
pages, headers, SEO, sitemap and the catch-all.

## Open Graph: generated at build

A prerendered endpoint (`src/pages/og/[name].png.ts`) produces one PNG per page with
satori and resvg: `home`, `listing-<section>-<language>`,
`detail-<section>-<id>-<language>`. The layout is a pure tree in `src/lib/og.ts`, in the
terminal style of concept D (`docs/DECISIONS.md` #19). Zero compute at runtime, no
injection surface, deterministic images. Satori gotcha: `woff`/`ttf` fonts, never `woff2`
(Geist Sans from `@fontsource/geist-sans`, Departure Mono from the `woff` in
`src/assets/fonts/`).

## Security and headers

CSP generated by Astro (`security.csp`) as a meta tag in the pages, with the hashes of
the inline scripts; the only external domains allowed are Umami (`analytics.esse.dev`) and
Turnstile (`challenges.cloudflare.com`, for `draft_message`). Umami is self-hosted and
cookieless, so no consent banner; it loads after the page and only on `esse.dev`
(`src/scripts/analytics.ts`). Custom events (`src/scripts/track.ts`) count interactions and
never carry the visitor's text. What the site collects and for how long is stated in the
privacy page, in categories (#23). `frame-ancestors` in the meta tag is
ignored, so it goes as a header in `public/_headers` together with
`X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options` and `Permissions-Policy`.
The Worker's responses (root, redirects, 404) do not go through `_headers`: the same
headers are added by `src/middleware.ts`. Hashed assets in `/_astro/` are cached as
immutable. No endpoint reflects user input.

## Interface: the site as a workspace

The site is used like an app (concept A, `docs/concepts/concept-a-spazio.html`, Cycle 12):
two columns as tall as the window, each with its own tone. On the left the list (logo,
search, items, a status line with the keys; the LED legend sits in the projects list), on
the right the content pane with a toolbar (path, document actions, language). No
full-width bar: with two tones on horizontal rows the page formed a T that matched no zone
(Cycle 13). Each item stays a static page with its own URL, with no router. The page
change is instant, like changing document in an app: the earlier fade with a rise (view
transition) looked like a site loading a new page and slowed down j k and h/l.

On a wide screen the two columns are two cards inside a rounded window, detached from the
edges. On mobile the window stays, with the content pane only. The window rests on a
background (`wallpaper`): a continuous diagonal veil from lavender to deep purple fading
into black, over a fine grid, with a single soft point of light at the top left
(`--wall-light`) that shows through the list. No scattered glows, which through the glass
turned into color blotches, and no green, which is reserved for live states. Frame, list,
pane, agent field and menus are glass (`glass` utility: strong blur, moderate saturation,
no white veil, which turns grey, and a border that catches a little light; values in
`--glass-*` and `--wall`). Only the glasses that contain no other glass blur (list, agent
field, menus): in Chromium a blurring glass inside another stops blurring, so the frame
has only the border and the pane blurs from a layer behind the content
(`data-pane-glass`, the same `panel` glass as the list, 48% on desktop: a darker pane read
as a different material), a sibling and not an ancestor of the agent
field and the menus, which therefore still blur. The toolbar stays flat. `surface` and
`hover` are light veils and not solid greys, so controls on the glass lighten instead of
acting as a hole: a single scale, hover `surface/60` and selection `surface` (the "you
are here" stays above the hover), pane blocks on `surface/60`, because a solid `panel` on
the glass does not stand out. `subtle` is tuned on the glass, where the veil behind is
lighter. It comes from concept C (`docs/concepts/concept-c-vetro.html`, variant B),
choices in `docs/DECISIONS.md` #16. No bounce and no scroll passing underneath:
`overscroll-none` on the page and on the main containers, `overscroll-x-none` on nested
blocks that scroll sideways; a rule on every element made Chromium hook the wheel to an
ancestor that does not scroll, and the list stopped. The style comes from concept B
(`docs/concepts/concept-b-stile.html`): lavender accent on a slightly cold black, a
phosphor green only for live or successful states (LED in progress and maintained,
copies and sends), Departure Mono for the interface monospace, and a CRT monitor veil
(phosphor glow on titles and labels, red-cyan fringe, lines and vignette) set by the
`--crt-*` variables in `global.css`. Choices in `docs/DECISIONS.md` #15. Labels with
`data-scramble` decode once when the pointer enters the link or button that contains
them and once when it leaves. Icons with `data-motion` make a gesture of their own on
hover of the link that contains them (concept E, `docs/concepts/concept-e-icone.html`):
the house jumps, the agent tilts its head, the line of Now traces itself and retracts in
a loop, the arrows go out and come back, the LEDs send out a ring; with the keyboard and
on touch they stay still. With `prefers-reduced-motion` only displacement stops: what
translates, rotates or scales gets an equivalent that stays put (the icons glow in the
accent, the mobile menu fades), while color, opacity and redrawn strokes keep running
(`docs/DECISIONS.md` #25).

- **List** (`src/lib/workspace.ts`): in order of importance and at most 900 px tall.
  First Welcome (the home) and the single pages (about, now, agent), then the project
  showcase with "all N" leading to the registry, method, writing. Projects outside the
  showcase stay in the page: search finds them and the open one appears. It is also the
  source of the pager order. At the bottom, above the status line, the external profiles
  (`SocialLinks.astro`, the same links as the contacts) as mono names with the arrow.
- **Navigation** (`src/scripts/workspace.ts`): j/k and arrows in the list, Enter, Esc to
  the level above, h/l (or the side arrows) for previous and next, `/` and Cmd/Ctrl+K for
  search. Not `[`/`]`: on the Italian Mac keyboard they need Option. The path in the
  toolbar always starts with `~`, which leads to the home. The level above (Esc,
  breadcrumb, "‹ section" on mobile) is computed from the `crumbs` and goes back through
  history when you arrive from there, so the registry finds its filters again. The
  document has only title, meta and text: no "Back" in the content.
- **Mobile**: every page shows the pane, which scrolls inside the window with the toolbar
  fixed at the top and "‹ section" as in iOS, and under it the tab bar
  (`src/components/workspace/TabBar.astro`, concept M): Home, Projects, the agent raised at
  the center, Method, and Menu. Menu opens the list (`data-drawer` on `[data-workspace]`)
  as a sheet that rises from below up to the bar, over the pane, which becomes inert; the
  bar stays usable and Menu turns into an X. It closes with Menu, Esc, a tap outside, a tap
  on its handle or by dragging the handle down: only the handle drags, because the list
  scrolls vertically (`touch-pan-y`, which does not pass inside a scrolling container and
  must be set on the list too). The sheet holds the search, the pages, the projects, the
  method and the profiles; the keys it does not. A phone has no hover: a tap sets
  `data-play` on a tab and its icon makes the gesture the desktop list makes on hover, and
  the sheet's blocks rise in turn as it opens. With reduced motion the tap glows and the
  sheet fades in place. Choices in `docs/DECISIONS.md` #31. The window stays still and only
  the pane scrolls, so Safari's bottom bar never shrinks. Safari 26 ignores `theme-color`
  and tints its bars from a fixed element on each edge or the html background: two solid
  strips on phones and the html background carry the wallpaper's edge colors, measured on
  its frame (`--color-bar-top`, `--color-bar-bottom`), and a closed full-screen layer leaves
  the page, since Safari samples it even at opacity 0.
- **Tokens** (`@theme` in `src/styles/global.css`): `desk` and `frame` behind and around
  the window; surfaces `bg`, `panel`, `surface`, `hover`;
  `line`; text `fg`, `text`, `muted`, `subtle` (the minimum for text, 4.5:1 measured on
  the glass); `accent` and `on-accent`; `live` for live states; `glow`, the deep purple
  of the veil behind the window; `danger`; `status-*` for the status of projects; radii
  `--radius-control`, `--radius-panel`, `--radius-card`, `--radius-window`, `--radius-edge`
  (the pane on a phone, close to the screen's corners). Shared classes: `.led`, `.kbd`,
  `.label`, `.chip`, `.ulink`, `.caret`.
- **Themes** (`docs/DECISIONS.md` #27): dark and light. The `@theme` values are the dark
  ones; `:root[data-theme='light']` overrides them, and the values that were white or black
  by hand (grid, scan lines, glass edge, vignette) are channel variables (`--veil-rgb`,
  `--shade-rgb`, `--glass-edge`) that the light theme flips. What changes shape rather than
  color uses the `light:` variant. The theme follows the system until the visitor picks one
  with the toggle in the toolbar (`src/scripts/theme.ts`, choice in `localStorage`, not
  saved when it equals the system's); `src/scripts/theme-init.js`, inline in the head, sets
  `data-theme` before the first paint, and `astro.config.mjs` computes its CSP hash from the
  same file, since Astro does not hash inline scripts. Logos and designed covers have a
  light variant written by the render scripts (#28).
- **Boot** (`docs/DECISIONS.md` #37): on the first visit the site boots like a computer
  (BIOS, systemd lines with the site's real data, login) before the window opens; on a
  release not seen yet, or after a week, a short boot names what changed. Decided before the
  first paint by `src/scripts/boot-init.js` (inline in `Workspace.astro`, CSP hash in
  `astro.config.mjs`), which marks `<html>` with `data-boot`; played by
  `src/scripts/boot.ts` on a desk-colored screen over the window, then on the interface itself
  as a skeleton loading piece by piece (`data-skel`: transparent ink and a thick underline as
  the bar, so the DOM and the layout do not change), with the data of
  `src/lib/boot.ts` (commit and day of the build from `vite.define`, counts, model,
  changelog ids) and the lines in the `boot` block of the `site` collection. The visit is
  in `localStorage` (`boot`: when, and the changelog ids seen). Automated browsers skip it.
- **Measure**: no maximum width on the content, the column and the fluid size set it
  (`Page.astro`, `Prose.astro`). In detail pages, from `xl`, the facts sit in a column on
  the right; the page fills at least the pane and the pager sits at the bottom.

## Agent

`/it/agente` is a static page with a Svelte island (`AgentChat.svelte`) that opens a
WebSocket to a Durable Object per visitor (`SiteAgent`, `src/agent/`). Inside runs
pi-durable through the Agents SDK's `PiHarness`: conversation in the object's SQLite,
resumption after a suspension, tools as pi extensions. The socket protocol and the event
reducer (`sockets.ts`, `view.ts`) come from the official example and are the same on both
sides.

- **Models:** from OpenRouter (`src/agent/models.ts`), `glm-5.3-flash` on an ordered list
  of fast providers with automatic fallback to the next, a timeout on a stream without
  tokens and pi's retries. Key `OPENROUTER_API_KEY` as a Worker secret. The `AI` binding
  remains only as an alternative transport for Jev. Choices in `docs/DECISIONS.md` #11.
- **Site tools:** `search_site`, `read_page`, `list_projects` and `show_page` read
  `/agent/index.json`, a site index generated at build from the same collections as the
  pages and read from the assets: the agent sees only what the site publishes.
  `show_page` becomes a card in the transcript, which the visitor opens when they want.
- **Code tools:** `repo_overview`, `list_files`, `read_file`, `search_code` and
  `recent_commits` read the public repos from GitHub's REST API (`github.ts`). The repo is
  a closed-value parameter: the `repo` of the published projects plus the site's own.
  `read_file` numbers the lines, gives the GitHub link and reads long files in pieces.
  With `GITHUB_TOKEN` (optional) the limit rises to 5,000 requests an hour and
  `search_code` searches the code; without it, it searches only file names. Choices in
  #13.
- **Capabilities:** `render` draws bars, tables and timelines. The model sends data,
  never HTML; the same validation (`render.ts`) runs in the Durable Object, which sends
  the error back to the model, and in the browser, which draws with the site's tokens
  (the bars are SVG: the CSP blocks inline styles).
- **`run_code`:** Cloudflare's Code Mode (`@cloudflare/codemode`, `run-code.ts`). The
  model writes a JavaScript function that calls the read-only tools as
  `codemode.name()`, with the TypeScript declarations generated from the schemas in the
  tool description. It runs in a Dynamic Worker (binding `LOADER`, paid plan) with no
  network or environment, with caps on time, calls and result size; every call goes
  through the same validation and the same `execute` as the normal tools.
- **`delegate`:** 1 to 3 sub-agents in the background (DECISIONS #33), with the
  persistent sub-agent scheme of pi-durable (its example 23). One commit creates, per
  call, a background anchor task that owns the children's conversations, the `Children`
  document of the main conversation (title, state, reserve, tokens, cost) and a background
  reporter task per child; the tool returns at once and the main agent goes on talking. A
  background task is a boundary: the main agent's Stop does not reach the children. The
  reporter hands the child its task, waits, closes its record, charges it (once, `memo`)
  and posts the findings to the main conversation as a message with a
  `[sub-agent #id "title" finished]` header, which starts a turn; that turn is charged by
  the reporter, since no socket waits for it. A stopped child, or a report with no credits
  left, becomes a model-only note (`app.child-note`, hidden in `projectEntry`). While a
  child works its worst case is held back from the budget (`#remaining`), at most 3 work
  at once, and the `sub-agents` prompt section tells the model their real state. Each
  child has a token cap (`child-budget.ts`): an extension selected only on the children
  that, once at the cap, asks for the final answer and blocks further tools. A child's
  session can be watched on its own socket (`?session=<id>`) and stopped (`abort`), not
  written to (`writable`); a reset stops the children first. Live list on the socket with
  the `children` message. On the page (#34, #39): chips on the field's panel, a token per
  child in the turn's work (`DelegateView.svelte` still reads the reports of calls from
  before #33), the live transcript in `ChildSheet.svelte` on the child's own socket, and the
  report as its own line, recognized by `parseReport`.
- **`draft_message`:** the model writes only a draft; the page shows it in an editable
  card with Turnstile and the visitor sends it. The server (`sendDraft`) checks that the
  draft is a call of the agent in this conversation and has not already gone out,
  verifies Turnstile, applies the daily caps (per visitor in the `SiteAgent`, for the
  site in the `Ledger`) and sends with the `send_email` binding to the address verified
  in `MAIL_TO` (`draft.ts`, `DraftView.svelte`), through Cloudflare Email Service. The
  Turnstile site key is public and lives in the code, chosen by host: the real one on
  `esse.dev`, the test one on localhost, where the real widget does not load. After a send
  or a failure the server writes a note for the model into the conversation, without a run,
  with the outcome and never the draft's text, so the agent knows how it went (#29).
- **`get_budget`:** the visitor's credits left today (the lowest of their own, their IP's
  and the site's budget, rounded like the page's counter), the daily credits and the
  reset time. The rules of the credits are in the prompt, so a question about them costs
  one call instead of a search in the site's code; it is the only tool allowed in the
  short chat mode, where Jev puts these questions.
- **Link to the agent:** `?ask=` writes a question into the input without sending it
  (the home uses it). Not `?q=`, which is the list's search.
- **Page with a conversation started:** `data-agent-started` on `[data-workspace]` hides
  title and introduction (they stay for screen readers) and shows "new conversation" in
  the toolbar. Answers can link to any domain (#18).
- **Empty conversation** (#38): the example questions and three abilities (site, code,
  sub-agents), each with the token it becomes in a conversation, in place of the list of
  tools by name. The catalog the server announces in `hello` still names the tools in the
  status line.
- **The transcript by turn** (#39): the visitor's message is a lilac bubble on the right;
  the agent's messages between two of the visitor's are one turn, its work under one header
  (state, steps, tokens and credits once) as tokens with an icon per family and a readable
  sentence with what came back (`src/agent/steps.ts`, sentences in the `site` texts). A
  token opens its call and result, the header the reasoning; cards, drafts and views stay
  in the answer, which follows.
- **Triage and limits:** first the per-IP burst (binding `AGENT_RATE`, Workers Rate
  Limiting), then the budget, then Jev (`triage.ts`), which stops off-topic and abuse and
  decides the language of the answer and of the notices. A chat message (intent `chat`)
  goes through, and if Jev is sure about it the prompt gets the short mode with no tools.
  Spending is deducted in real cost per visitor (in the `SiteAgent`), per daily IP
  fingerprint and for the whole site (both in the `Ledger` Durable Object), with the
  thresholds in `budget.ts`; the IP is not stored, only the SHA-256 fingerprint of day and
  address. In the page the budget is shown in credits, only when it is about to run out.
  If Jev does not answer the message goes through and the cap applies. The thresholds are
  verified with `pnpm eval:jev` on a labeled set (`tests/eval/jev-triage.json`), which
  also contains attacks. Choices in `docs/DECISIONS.md` #12 and #17.
- **Transcript:** Markdown passed through a sanitizing renderer (`markdown.ts`), reasoning
  collapsed, Jev's verdict, tokens, cost and remaining budget for every answer.
- **States:** a status line under the answer shows the phase of the work (Jev, thinking,
  reasoning, the tool at work, writing, retry with countdown), derived in the browser by
  `phaseOf` (`phase.ts`) from the session view and the message waiting for Jev, with no
  extra server events. Errors go through `errorKind` and show by kind in the visitor's
  language, the raw text under "details"; a resumed conversation, a dropped connection, an
  agent that never answers and a message queued behind an answer have their own state. An
  empty snapshot after a conversation (it expired with the page open) resets what lives only
  in the browser. Before hydration `AgentFallback.astro` holds the field in place. The
  streamed text glows and cools (`phosphor.ts`). Choices in #24.
- **Retention:** a conversation expires 90 days after the last message (`retention.ts`,
  #23). Every settled turn moves the `expire` job of the object's Lifecycle queue; when it
  runs, it disables the alarms, deletes the storage and resets the instance. "New
  conversation" does not delete. The privacy page states the same number.

The Worker code has its own `tsconfig.worker.json`: the Cloudflare runtime types
(`worker-configuration.d.ts`, generated by `wrangler types`) clash with the DOM ones.

## Boundary

Thin pages -> `src/lib/content.ts` (data) -> collection schemas (validation) ->
components (UI). The pure logic (i18n, SEO, list filters, reading metrics, showcase,
related items, OG layout, 404 suggestions) is in `src/lib/` modules with no Astro
dependency, testable with vitest in Node. The same for the agent: the pure logic (budget,
triage, site index, transcript, phase of the work) lives in `src/agent/` modules separate
from the Durable Object. The Svelte islands receive already serialized data (`ListItem` in
`src/lib/listing.ts`) and do not read content.
