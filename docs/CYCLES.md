# Cycles

Chronological log of the project's work cycles. Each cycle records goal, work done (with
commit references), checks and what remains. It serves to pick up the thread between one
session and the next. High-level planning lives in `docs/ROADMAP.md`.

Older cycles are in `docs/archive/` (Cycles 1-6 in `CYCLES-1-6.md`, 7-8 in
`CYCLES-7-8.md`).

---

## Cycle 9 - "Laboratorio" restyle (2026-06-04)

### Goal

Visual rebrand: from a "generic dark dev portfolio" to a coherent "Laboratorio" identity.
First the message (voice and positioning), then the design system. The full vision, the
ideas considered and the discarded ones live in `docs/archive/RESTYLE.md`.

### On `main` (pushed)

- `feat(content)`: welcome repositioned AI-first. Out the defensive framing ("the human
  decides the architecture, AI speeds up, the human validates") for an AI-first one: the
  human designs the system, the AI writes, the output is production-ready.
- `feat(content)`: label of the `idea` status -> "Esplorazione" / "Exploration" (the
  internal key stays `idea`).

### On branch `restyle/laboratory` (NOT merged)

- **Palette:** flat black + **electric blue** accent `#2cc3f7` + perspective floor (grid)
  - CRT glow from below. Gone the blue gradients and noise.
- **Typography:** **Martian Mono** (titles, tech labels) + **IBM Plex Sans** (body).
  Radius tokens (`--radius-md/lg/xl`) for moderate rounding from a single point.
- **Hero:** "I cast code." (mono, double meaning of cast), left-aligned, signature at the
  bottom "Simone Salerno · half engineer, half wizard".
- **Navbar:** text logo `essedev_` (blinking cursor), items with a numbered index
  (01-04), status bar below, inline `IT / EN` language toggle (in place of the dropdown).
- **Card + StatusBadge:** archive card (status + year header, mono tags, blue border hover
  - lift); "system line" badge (dot + mono label); applied to the ArticleCard too (date
    header).
- **Filters:** squared mono toolbar (SearchFilter + all the dropdowns).
- **Footer:** brand + tagline + numbered nav + system line. Squared **FloatingNav** with
  numbers. Squared **back-to-top**.
- **Keyboard shortcuts:** `1-4` -> sections, `0`/`Home` -> top, `End` -> bottom
  (reduced-motion aware). The navbar numbers are the reminder of the shortcuts.
- **Coherence:** `//` removed from the content of the items (it was misplaced
  decoration); numbers only where needed.

### Key decisions (rejected, see docs/archive/RESTYLE.md)

- "Double S" motif (recalls something else -> handle "essedev").
- Fonts: Jacquard 12/24 (fantasy, does not fit); Fraunces italic (big serif on dark is the
  aesthetic of AI-generated templates).
- Color: orange (complementary to the blue logo, fights it), purple (AI cliche), logo blue
  (generic) -> electric blue.
- Custom hero animations **frozen**: tuning them blind (without seeing the motion in
  screenshots) does not converge; to be redone as a coherent system.

### Checks

- `pnpm lint`: clean; `pnpm check`: 0 errors (along all the branch's commits).
- Shortcuts tested via browser (`0`->top, `End`->bottom, `2`->about section).
- **NOT yet done:** full `pnpm build` + `pnpm test:ci`. Some E2E tests need updating
  (changed nav items, welcome, status badges).

### Block 1 - remaining pages (done)

- **Detail pages:** project/article tags from pills (`rounded-full bg-gray-800`) to
  squared mono tags coherent with the cards (border, accent hover); featured image from
  `rounded-3xl` (outside the tokens) to `rounded-xl`. Project detail layout aligned with
  the article: full-width header, full-width image below, content below (before the image
  sat beside it at 50% and the body was squeezed into half a column).
- **Pagination:** from `rounded-lg` + hardcoded English text ("Prev/Next/Page X of Y") to
  a mono numbered index `01 / 04` (current in accent), language-agnostic.
- **404:** number in mono accent + mono back link with accent hover.
- **Contacts / filter chips:** contacts underline that grows in accent (it was grey);
  filter-removal X buttons `rounded-sm` (they were `rounded-full`) and accent (it was
  `blue-400`).

### Block 2 - polish: footer, controls, accent theme (done)

- **"Dashboard" footer:** RSS/Sitemap/Source as squared modules with an icon (mono, accent
  hover), opening in a new tab (XML resources, no redirect). MotionToggle = button with a
  squared mechanical switch (solid thumb + CRT glow when on).
- **Uniform buttons:** a single standard everywhere (`bg-white/[0.02]`, border `white/10`,
  `hover:border-accent/50`, `rounded-md`; hover-fill `text-accent` for links,
  `bg-white/10` for controls). Opacity/surface outliers brought back in.
- **Sitemap:** CSS redone on the theme (black + glow, Martian Mono, accent loc/label,
  squared cards with hover).
- **Status bar:** claim `Human vision · AI execution` + location; gone the decorative dot
  and the dead `IT / EN` (it duplicated the real language selector above).
- **StatusBadge:** round dot -> small square (coherent with the squared language).
- **Centralized accent theme:** glow and shadows derive from `var(--color-accent)` via
  `color-mix`; the sitemap (separate CSS) from a local `--accent`. The accent lives in a
  single place.
- **Accent picker (feature):** floating selector at the bottom left, default blue +
  orange/purple. It overrides `--color-accent` at runtime (the whole site changes live);
  the change is a "hue recalibration" (HSL sweep, shortest path, exact snap) and the
  selection ring slides. Persistent in localStorage, respects the motion toggle.
  OG/identity stay on the default blue.
- **Animation switch fix:** the thumb slides when turning on AND off (before, turning off
  applied `data-motion=reduced`, which froze its animation; targeted exception on the
  thumb, on the `translate` property - Tailwind v4 does not use `transform`).
- **Mobile menu:** overlay redone - X aligned with the hamburger (before `fixed`
  elsewhere, it "jumped"), mono numbered-index items like the navbar, system line at the
  bottom; the accent picker hides when the menu is open. Gone the `isFloatingNavVisible`
  prop.
- **Language selector:** from `IT / EN` text with a slash (it looked like two loose
  links) to a bordered mono segmented control, active cell in accent - coherent with the
  other controls (navbar, floating nav, mobile overlay).

### Block 3 - instrumental chassis and unified nav (done)

- **Chassis (`Chassis.svelte`):** fixed frame around the content that carries live state
  instead of decoration - current section with the navbar index (left rail), scroll
  progress as a scale (right), claim (top), Milan time and shortcut reminder (bottom). It
  is a `fixed` overlay, not a scroll container: native scroll, anchors and shortcuts keep
  working. `aria-hidden` on purpose: it is telemetry, not content, and the percentage
  updates on every scroll.
- **The gutter is a token:** the rails live in `--chassis-gutter` (`0px` below `lg`,
  `34px` above). Below `lg` the chassis does not mount and the claim goes back to the
  navbar's status bar. Every `fixed` element must be detached from the edge with the same
  token, otherwise it ends up above a rail.
- **Matte:** a layer above the content clips background (300vw-wide grid) and scrolling
  content to the screen area. Its radius is gutter + `--radius-md`, because the inner
  radius of a border is the outer one minus the thickness: without it, the content
  stuck out at the four corners. The link bar sits flush with the chassis, which paints
  over it: before it was 1px detached and a gap showed through.
- **Controls promoted to instruments:** accent picker in the left rail as unlit LEDs with
  an accent tick on the active cell; language as a vertical EN/IT pair on the same side,
  with the same index tick (the inactive one stays at full opacity: 32% holds on a color
  dot, on a 9.5px word it composes almost black); back-to-top from a box to a chevron
  above `TOP` at the foot of the scale, with the arrow rising on hover. No drag or scrub
  on the scale: that gutter overlaps the system scrollbar and a slider would fight the
  `0`/`Home`/`End`/`1-4` shortcuts.
- **A single navigation surface:** removed the `FloatingNav`, which duplicated the
  navbar's wordmark, links and language selector; with the chassis it was the only object
  belonging neither to the frame nor to the screen. What remains is a 64px bar with the
  four items as equal cells divided by hairlines and the wordmark at the head, aligned to
  the content column. It is `fixed`, not `sticky`: `overflow-x: hidden` on body and
  container (needed by the 300vw grid) makes the ancestor the scrollport, so sticky would
  never attach. Below `lg` the navbar scrolls away and a floating burger keeps the menu
  reachable.
- **Section header (`SectionHeader.svelte`):** every section opens with the navbar's
  numbered index, a line and a readout computed from the content itself (projects: count
  and range of years from `meta.json`), so frame and content say the same thing. The
  readout appears only where real data supports it: articles stay bare under the two
  posts (a count of 1 points a spotlight at the empty blog), about and contacts have
  nothing structured to report. Count and years come from a single source: passing only
  the total, the listing showed the real count next to the range of the current page.
- **Full-bleed lines between sections removed:** the hero ended with `border-b` and the
  next section opened with `border-t`, two overlapping lines at every joint. With the
  section header they were redundant anyway: the boundary is already marked by it,
  carrying index and readout instead of nothing.

### Block 4 - content, typographic indexes, CRT, favicon (done)

- **Project recuration (`f5d3c89`):** 19 projects published instead of 25 (4 in progress,
  5 completed, 6 archived, 4 ideas); the 15 excluded are `published: false`, not deleted,
  so recoverable. Copy rewritten in first person from the repos' READMEs, without the
  inflated metrics of the old stubs. Home showcase led by Relay, Nexus and Flux
  (`config/featured.json`).
- **Two densities in the project listing (`d0c55b3`):** in progress and completed stay as
  cards with an image (showcase); archived and ideas become a one-line typographic index
  (year, title, excerpt) on two columns below. Split in `utils/shelf.ts` (tested). The
  home shows only the showcase, in the order of the featured. The project listing is no
  longer paginated: pagination would cut the two densities in half and the collection is
  small on purpose. The label of the `idea` status goes back to "Idea" (it was
  "Esplorazione").
- **Articles as an index (`ed7f8dd`):** the only article sat alone in a three-column grid
  behind a placeholder. Now it uses the same typographic index, with the full date on the
  left; the component is generalized from `ProjectIndex` to `EntryIndex`. Articles stay
  paginated (6 per page).
- **Section index fix in IT (`1d6ae6d`):** header and rail of the chassis compared the
  logical key (`projects`) with the translated name (`progetti`) and in Italian lost the
  index. Now it resolves by anchor (`#projects`), the same in every language.
- **Contacts (`f04dd22`):** large email, profiles on one mono line with an outgoing arrow;
  the `mailto` no longer opens an empty tab.
- **First dose of CRT (`eb5ca29`):** three static marks, none animated: inner vignette on
  the chassis (only from `lg`), phosphor glow on accent text (derived from the token) and
  scanlines only on the project thumbnails.
- **Favicon and manifest (`ea8d904`):** a single drawing (dark screen with chassis, "e" in
  Martian Mono, accent block cursor) from which `scripts/generate-favicons.ts` generates
  all the sizes. The outputs are committed and the script is not in the build: rerun with
  `pnpm generate-favicons` when the drawing or the default accent changes.

### Block 5 - UI review: tokens, materials, mobile dock, reading column (done)

Audit with Playwright on 5 pages at 3 viewports (390, 768, 1440) plus metrics from the
DOM. No bugs: the problem was grammar. Eleven radii, eight border opacities, five
container backgrounds, eight mono sizes, four chip styles, three different objects for
the three floating mobile controls, text at 1300px on desktop.

- **Tokens and materials (`c3defa0`):** in the `@theme` two radii, three lines, three
  surfaces, four mono sizes; in `@layer components` `.panel`, `.chip`, `.field`, `.label`,
  `.section` and the sizes of `.key` (`--sm`, `--icon`, `--float`). Every component
  consumes them, no hand-written value. The `.archive-card` and `.entry-panel` classes
  disappear into `.panel`.
- **Card and index (`9edf31d`):** 21:9 thumbnail below `sm`, three-line excerpt, a single
  row of three chips that shrink with an ellipsis plus a count: stable height in the
  grid. Below `md` the index no longer has the empty 3rem column: year inline to the
  right of the title, long date above, two-line excerpt (row of ~90px instead of
  150-175).
- **Mobile dock (`c605466`):** menu, back-to-top and accent are the same 44px
  `key--icon key--float` key; the picker becomes a key with the lit LED that cycles the
  themes, the header burger and the floating one share the cell, the footer keeps 6rem of
  clearance below `lg`.
- **Reading column (`7a377fb`):** About and Contacts at `max-w-prose`, project and article
  in a `max-w-3xl` column on the left (which also resizes the hero image); excerpt in
  roman, article meta as a label, 404 link as a key.
- **Frame:** the rails move to the single `text-tele` size and to the panels' `line-2`
  border, without changing the design.
- **Desktop, second pass:** the remaining "mix" was one of roles, not of measures. Section
  titles in Martian Mono medium like hero and nav (the instrument), sans only for content;
  greys remapped to neutral in the `@theme` (Tailwind's gray scale is bluish and clashed
  with an orange or purple accent) and gone every `text-white/NN`; card and index titles
  at the same weight (500); tags as chips in the index too; status as a colored LED with a
  neutral label; Lucide arrows in place of the Unicode ones. The image placeholder is a
  switched-off screen (grid, accent glow, label) and detail pages no longer show the hero
  image: `src/lib/assets/images` is empty, the block returns when there are real images.
- **Keycap (`docs/archive/concepts/system-variants.html`, choice B):** after two passes
  the lit key still did not convince: the background tinted at 8% sat halfway and read as
  disabled. Three complete systems compared (Modulo, Keycap, Terminale) with cards, keys
  and TOP together; Keycap chosen and extended to all surfaces: keycap for what is
  touched (keys, chips, TOP in the rail), inset for what is written in (fields, switch
  track), shell for what contains (cards, index, filters, opaque dropdowns), screen inset
  in the card.
- **Chassis in the same material:** the gutter becomes the shell (face of the cards) and
  the screen is inset with a black seam and an inward shadow; language and accent LED in
  the rail are 26px keycaps like back-to-top; the navbar from `lg` is a band with the
  shell's face, flat cells (a menu is not a keyboard).
- **Two worlds:** keycaps with a ground shadow inside a screen were physical objects drawn
  on a monitor. Model chosen: device with a screen. Outside (chassis, rail, navbar)
  hardware, with `.key--hw` as the only keycap; inside all software, flat: thin-border
  panels, solid-background buttons with no thickness, flat chips and fields, hover as
  light and not as displacement. The "control panel" (all physical) was rejected: it does
  not hold long prose or mobile, where the chassis is absent.
- **Hero and detail:** the hero title had negative margins inside an `overflow-hidden`
  that with Martian Mono clipped the ascenders; both removed. Project and article pages
  leave the narrow 48rem column for a two-column layout from `lg`: sticky spec sheet on
  the left, body on the right at 68ch.
- Gate at the end of the round: lint, check 0 errors, build, 196 unit, 32 e2e.

### What remains

- Big worksites: animations as a system. Self-produced pixel art is rejected (see
  `docs/archive/RESTYLE.md`); project content (Block 4) and UI system (Block 5) done.
- Before merge/live: `build` + `test:ci` + update the E2E tests + merge to `main`.

## Cycle 10 - Restart from the base style (2026-09-26)

Branch `restyle/base` from `restyle/laboratory`. The presentation layer goes back to that
of `main` (`app.html`, `globals.css`, components, sections, routes, OG, favicon,
`svelte-inview` and `FloatingNav` restored); content, schema (`eyebrow`), loader,
`translations.ts` and unit tests remain. Removed `Chassis`, `EntryIndex`, `SectionHeader`,
`AccentPicker`, `themes.ts`, `reveal.ts`, `shelf.ts` and the favicon script. Reason in
`docs/archive/RESTYLE.md` ("Stop and restart"). Gate: lint, check 0 errors, build, 193
unit, 32 e2e. `restyle/laboratory` stays intact to pick the pieces worth keeping.

## Cycle 11 - Rewrite in Astro with a neutral look (2026-10-03)

Branch `astro` from `restyle/base`. Simone asked to rebuild the site in Astro before
working on style, projects and the AI touch (`ROADMAP.md`), with a neutral look to use as
a canvas and freedom not to port everything 1:1.

- **Content:** one-off script from the block JSON to `meta.json` + `<lang>.md` for
  projects, articles and pages; no syntax warnings. Placeholder image fields removed,
  `about` removed from navigation (it was not a page), UI strings reduced to those used.
  The article image comes back from the backup.
- **Platform:** static pages, Worker only for root and catch-all (DECISIONS #10). The
  redirect logic, before inside `hooks.server.ts`, is the pure function `resolveRedirect`,
  tested; it now also handles a route with no language (`/progetti`).
- **Removed:** FloatingNav, BackToTop, MotionToggle and animations, PixelBlast with
  `three`/`postprocessing`, noise, date-range filter, article pagination (only one),
  styled sitemap, validation and image scripts (the build does it). They stay in the
  history of `main`.
- **New:** list filters in the query string, localized and `noindex` 404, self-hosted
  fonts (no Google Fonts in the CSP), Umami limited to the production domains, neutral OG
  images generated by a prerendered endpoint.
- **Tests:** 55 unit (i18n and redirects, SEO, filters, metrics from Markdown, OG, texts)
  and 36 E2E against `wrangler dev`, including filters, CSP and 404.
- **Single card and custom controls (same cycle, on request):** articles and projects
  have the same card. The native selects are replaced by `ui/Select.svelte` (single,
  multiple, with search), with chips of the active filters and multiple filters in OR in
  the query string. The E2E tests now run on :8788 with an always fresh server: an
  orphan `workerd` on :8787 served an old build and had made 25 tests fail.

## Cycle 12 - Structure: the site as a workspace (2026-10-03)

After reasoning on texts and structure (voice and themes from job-seorch and
doppia-linkedin, engineers' sites and current trends), three structure mockups
(`struttura.html`) looked like "the usual developer portfolio". Two concepts with real
interaction, made by two subagents in parallel: A workspace, B document. A chosen.

- **Port to Astro:** `Workspace.astro` shell with list, detail, status bar and palette;
  every item is a static page. Keyboard interaction in a single script, native browser
  transitions (compatible with the CSP).
- **Content:** new collections method and now; projects separate `repo` and `site` and
  have `install`, `license` and the `why` line for those in the showcase. Release numbers
  are no longer saved (Relay was already at 54 against the mockup's 51): the releases page
  is linked. Articles from `blog` to `scritti`/`writing`, with redirects of the old
  routes. "About" without the list that duplicated the method.
- **Tests:** 57 unit (legacy routes, sections without detail) and 45 E2E (keyboard,
  filter, palette, Esc, sections in both languages).
- **To do (said by Simone):** many details of spacing, sizes and lines.

## Cycle 13 - The workspace, refined in short rounds (2026-10-03)

Short rounds looking at the site, each correction of Simone turned into a rule in the
project's `CLAUDE.md`.

- **One control per type:** a single search (it also filters the registry, it also
  searches in tags), a single cursor, no accent line on the selection. Palette and
  registry search field removed. The Umami script in the head held back the load event on
  a slow network and was the real cause of the unstable E2E tests: it now starts after
  load and only on esse.dev.
- **Two columns:** top bar and status bar made a two-tone T that matched no zone. Now list
  and pane are as tall as the window, the pane has a toolbar (path, document actions,
  language) and the "back to top" is no longer in the content: breadcrumb, Esc and
  "‹ section" on mobile, with history when arriving from the parent (the registry's
  filters stay).
- **Pager and list:** the pager sits at the bottom of the pane even on short pages, h/l
  to browse (not `[`/`]`: on the Italian Mac keyboard they need Option). The list goes in
  order of importance and fits in 900 px: about and now, then the showcase of 6 projects
  with "all N", method, writing.
- **Agent plan (M17):** a page is a real agent on Cloudflare (Agents SDK, pi-agent-core
  1.x, Svelte island), in place of the idea of the site redesigned live. Choices in
  `docs/DECISIONS.md` #11.
- **Tests:** 58 unit and 50 E2E.

## Cycle 14 - The site agent, first version (2026-10-03)

First cut of M17 (`f3b1955` .. `ed09dab`): `/it/agente` (and `/en/agent`) is a row of the
list and a static page with a Svelte island that opens a WebSocket to a Durable Object per
visitor.

- **Base:** `SiteAgent` hosts pi-durable with the Agents SDK's `PiHarness`; conversation in
  the object's SQLite, resume after a suspension. Tools `search_site` and `read_page` on
  the `/agent/index.json` index generated at build. Socket protocol and event reducer
  adapted from the official example (MIT). The Worker code has its own tsconfig: the
  Cloudflare runtime types clash with the DOM ones.
- **Models:** started on the `AI` binding (Workers AI), moved to `glm-5.3-flash` from
  OpenRouter with the fastest providers in order: the same question with three tools from
  about 40 s to about 7. 30 s timeout on the stream, pi's retries, notice and "retry" after
  a final error (DECISIONS #11).
- **Triage and spend:** every message goes first through Jev, which stops off-topic and
  abuse and picks the language; limit in real cost per visitor and for the site
  (`Ledger`). Jev moved from Workers AI (it needed AI Gateway credits) to TypeSafe direct
  and finally to OpenRouter with the same key as the model; it receives the site's titles
  as `site_topics`, without which it read "Relay and Portsage" as off-topic (DECISIONS
  #12).
- **Jev evaluation:** 54 labeled messages and `pnpm eval:jev` (real calls, outside
  `test:ci`). The first trial let through 4 of the 19 messages that should be stopped; with the
  thresholds on the off-topic plus abuse mass the result is 53 out of 54, 0 legitimate
  questions stopped.
- **Transcript:** sanitized Markdown, collapsed reasoning, Jev's verdict, tokens, cost and
  remaining budget per answer.
- **Tests:** 73 unit and 52 E2E (the agent's E2E tests open the session but do not send
  messages, which would call a real model).
- **Next step:** the tools that remain in M17 (`list_projects`, public repos, `open_page`,
  then the demo ones) and Turnstile.

## Cycle 15 - The agent reads the projects and their code (2026-10-03)

Second cut of M17: from 2 to 9 tools, split in the page between "on the site" and "on the
code".

- **Site:** `list_projects` (filters by status and tag, showcase first; the index now marks
  the projects in the showcase) and `show_page`, which becomes a card to open in the
  transcript instead of navigating (DECISIONS #13).
- **Code:** `repo_overview`, `list_files`, `read_file`, `search_code`, `recent_commits` on
  the GitHub REST API, only on the repos of the published projects plus the site's.
  `read_file` numbers the lines, gives the GitHub link and reads long files in pieces;
  answers cached for 5 minutes; `GITHUB_TOKEN` optional.
- **Real trials:** the first call on the Worker failed with "Illegal invocation" (`fetch`
  saved in a field loses its `this`; in Node and in tests it does not happen). On the
  question "how does Portsage know which ports are busy" the agent finds `scanner.rs` in 7
  calls, for about 0.2 cents; the prompt now asks to copy the code without invented
  comments and to cite the lines with the link.
- **Agent page** (afa1abe): it read like a document, with the input where a 55vh minimum
  ended and an empty conversation with nothing. Now the input stays fixed at the bottom of
  the pane and the page fills it (on mobile the content column grows too). With an empty
  conversation: the tools announced by the server, how triage and costs work, three
  suggested questions that start immediately. The transcript follows the answer only if
  the reader is already at the bottom.
- **Transcript:** answers use the same prose styles as the site (lists, code blocks,
  links).
- **Tests:** 87 unit and 54 E2E.
- **Next step:** `GITHUB_TOKEN` to create; then `render` and `run_code`, together with the
  evaluation of `@cloudflare/computer`.

## Cycle 16 - The agent's demo tools (2026-10-03)

Third cut of M17 (`14bc4be` .. `871d7eb`): from 9 to 13 tools, with a "Capabilities" group
in the page.

- **`render`:** bars, tables and timelines from data, never HTML; same validation on the
  server and in the browser, bars in SVG for the CSP.
- **`run_code`:** Cloudflare's Code Mode (`@cloudflare/codemode`) in a Dynamic Worker with
  no network; the read-only tools inside the sandbox, with types generated from the
  schemas. JavaScript and not Python, chosen with Simone (#14). Trial: 12 parallel calls on
  the 6 repos in one execution, then a table with `render`, about 0.14 cents.
- **`delegate`:** 2-3 sub-agents as pi-durable conversations owned by the call, with only
  the read-only tools; their cost is deducted by the tool. Trial on the Relay, Portsage,
  Templator comparison: 3 children of 6-7 calls, about 1.4 cents and 50 s.
- **`draft_message`:** editable draft, sending by the visitor after Turnstile, caps of 3 a
  day per visitor and 30 for the site, email via `send_email` to `MAIL_TO`. A draft
  invented on the socket is rejected.
- **Bugs found in the trials:** a Svelte prop called `state` broke `$state` at runtime
  with no check error; Markdown headings in the answers came out huge.
- **Tests:** 99 unit and 54 E2E.
- **Next step:** tuning of secrets and Email Routing for production (in ROADMAP),
  sub-agent events live.
- **Credits and caps (after):** budget per visitor at 10 cents, shown in credits (1,000 a
  day) and only below 30%; cap of 12,000 tokens per `delegate` child and no children
  without credits for the worst case. Same question on three repos: from about 140 to 93
  credits, from 50 to 29 s.

## Cycle 17 - Concept B's style and the slimmer home (2026-10-04)

Round on M15 (`0c7cf2c` .. `709e47c`): the style chosen in a separate concept, then home
and list refined in short rounds.

- **Style (#15):** `docs/concepts/concept-b-stile.html`, three rounds with palette, mono
  font, CRT effect and frame tunable live, then applied (`ccfa654`, `2d270b1`): lavender
  accent (palette G), Departure Mono for the interface mono (code in prose stays Geist
  Mono), CRT veil set by the `--crt-*` variables, on a wide screen a rounded window with
  list and content as two cards; mobile stays flush. A phosphor green with a single job:
  LED in progress, agent at work, successful copy or send.
- **Motion:** instant page change, no view transition (`58cd7e7`); labels decode once when
  the pointer enters and once when it leaves, not on every `pointerover` (`8eed59c`).
- **Home:** gone the whoami line above the name; fewer duplicates (the line about the
  build goes into the intro, the project count stays in the list); "Where to start" with
  three items: the agent with an example question that ends up in its input without
  starting, Relay, the method. Chosen by comparing a temporary `/v2`, then removed. In
  the text the coding agents are separated from the agents in products, which run on
  custom harnesses.
- **Fix:** the example question used `?q=`, which is the site's search, and also filled the
  list's box: now it is `?ask=`, with an E2E that checks it (`dcbe36c`).
- **Agent page:** first the suggestions, then the 13 tools as names on three lines, with a
  line describing the one under the pointer, focus or touch (`d27aa6e`).
- **List and toolbar** (`07752bd`, `709e47c`): Welcome row at the top of the list, Activity
  icon in green for Now, `~` as the first step of every path, external profiles as mono
  names with the arrow (Lucide has no logos) next to the email on the home and at the
  bottom of the list.
- **Tests:** 99 unit and 55 E2E.
- **Next step:** mobile (the window on mobile too, button and drawer for the list), the
  height of the list beyond 900 px, the agent page that on mobile opens scrolled to the
  bottom.

## Cycle 18 - Mobile as a window with a drawer (2026-10-04)

Round on M15: mobile takes the same shape as the wide screen.

- **Window:** on mobile too the shell is detached from the edges (6 px, `desk` background)
  and the pane is a rounded card that scrolls inside itself, with the toolbar fixed at the
  top. Before, the whole page scrolled and the home showed the list below the
  presentation.
- **Drawer:** the list comes in from the left like a card above the pane, with logo, X,
  search, items, profiles and legend (the keys stay only on desktop). It opens from the
  `PanelLeft` button in the toolbar or from the magnifier, which goes straight to search;
  it closes with Esc, the X, a tap outside or by dragging it to the left. The pane below
  becomes `inert`, focus enters the drawer and returns to the button. Visibility changes
  immediately on opening and at the end of the stroke on closing, otherwise focus does
  not enter in the same gesture.
- **Fix:** the agent page no longer scrolls to the bottom with an empty conversation
  (`0c2518f`); `theme-color` aligned with the new background.
- **CRT veil** (`5454486`): about a quarter lighter (glow, fringe, lines and vignette),
  always and only from the `--crt-*` variables.
- **Tests:** 104 unit and 57 E2E (drawer: Esc, X, tap outside, search from the magnifier).
- **Next step:** the full round on a real iPhone, the agent placeholder on two lines, the
  height of the list beyond 900 px.

## Cycle 19 - Glass, the chatting agent, per-IP limits (2026-10-04)

Round on M15 and M17 (`9a1005e` .. `e85f4c7`).

- **Glass (#16):** `docs/concepts/concept-c-vetro.html` with variants tunable live, B
  chosen with the flat top bar. The window rests on a colored background (`wallpaper`);
  frame, list, pane, agent field and menus are glass (`glass` utility, values in
  `--glass-*`). Short rounds on the background: separate glows became blotches through the
  glass, now it is a continuous diagonal veil with `--wall` at 0.2. A white veil on the
  glass turned it grey, and is at zero. `subtle` raised to `#908e9b`, measured on the glass
  where the veil behind is lighter; `surface` and `hover` become light veils instead of
  solid greys.
- **Nested blur** (`a68c6c7`): in Chromium a blurring glass inside another blurring one
  stops blurring, and the agent field showed the transcript behind it sharp. Frame and
  pane keep only the glass border; list, agent field and menus blur.
- **Overscroll:** no bounce and no scroll passing underneath. `overscroll-none` on every
  element stopped the wheel on the list after the first hit (Chromium hooked it to an
  ancestor that does not scroll): now it sits on the page and the main containers, and
  the nested blocks (code, tables, tool output) have only `overscroll-x-none`, otherwise
  the wheel over a command did not scroll the page. Never a rule on `*`.
- **Drawer** (`5384214`): `touch-action` does not pass inside a scrolling container, so
  inside the list the browser took the gesture and dragging to the left no longer closed
  it. The list has `touch-pan-y` too; an E2E sends real touches via CDP.
- **Agent page:** title and introduction disappear once the conversation starts (they stay
  for screen readers), "new conversation" moves to the toolbar and appears only then; the
  notices follow the language of the message detected by Jev, not the page's.
- **Chat** (`adb4ef5`): Jev has a `chat` intent (greetings, jokes, thanks, questions about
  the agent) that goes to the model; the chat mode (two or three sentences, no tools)
  triggers only with `chat` at least 0.7, so a real question read half as chat still
  searches the site. Off-topic now means a real task unrelated to Simone. The prompt has a
  voice (sharp, warm, a bit playful, never human, no emoji).
- **Per-IP limits (#17,** `e85f4c7`): the visitor id is chosen by the browser and its cap
  was bypassed. Burst of 10 messages a minute per IP with Workers Rate Limiting, before
  Jev; 50 cents a day per IP in the `Ledger`, with a SHA-256 fingerprint of day and
  address, never the IP in clear. The burst has its own notice.
- **Red team:** Jev's set goes to 76 cases with 10 attacks, some disguised as a game or a
  joke: 72 right decisions out of 76. Of the 10 attacks 7 stop at the triage, the 3 that
  pass were refused by the model in a live trial.
- **Links in answers (#18):** no allowlist of external domains, for now.
- **Mobile:** agent placeholder on one line, link to the releases written as a path
  (`f8dc543`); Instagram and X handles fixed to `essedotdev`.
- **Concept D** (`docs/concepts/concept-d-og.html`): proposals for the OG images and the
  favicon, awaiting Simone's choice.
- **Tests:** 106 unit and 61 E2E.
- **Next step:** OG and favicon from concept D, the height of the list beyond 900 px.

## Cycle 20 - OG and favicon from concept D (2026-10-04)

- **OG (#19):** direction B, the terminal: command that opens the page, title with the
  lavender cursor (word by word, so on two lines it follows the last word), excerpt, mono
  metadata with the status LED, CRT lines. 45 PNGs generated at build. Departure Mono
  converted to `woff` for satori.
- **Favicon (#19):** the logo cursor alone, proposal 7 of concept D, after a round with
  three variants of a vertical cursor (s, e, cursor alone). `scripts/generate-favicons.ts`
  (`pnpm favicons`) produces SVG, ICO with PNG inside, PNG for iOS and manifest; manifest
  with the new colors.
- **Tests:** unit on command, metadata, LED and title size of the OG images.
- **M15 closed** by Simone: structure and style done; the height of the list stays among
  the Open items of the ROADMAP.

## Cycle 21 - The glass pane, M16 started (2026-10-04 / 2026-10-05)

Round on M15 (finishing touches) and first cut of M16 (`5617709` .. `e85ea97`).

- **Glass pane:** the content goes from black to a lighter tone (`pane` token), then back
  to glass blurring from a sibling layer behind toolbar and content (`data-pane-glass`,
  `43abe85`): so the agent field and the menus, which are in the content, still blur
  (#16). A single soft point of light in the background, seen through the list.
- **Veils on the glass** (`012b028`, `9a9dd1c`): solid `bg-panel` on the glass did not
  show, and row hover, the "Why" box and the agent's blocks looked empty. Now the blocks
  sit on `surface/60` and there is a single scale: hover `surface/60`, selection
  `surface`, `hover` only for controls that already start from a veil.
- **Rejected by Simone:** pixel-art cursors with a light following the pointer (concept E,
  tried and undone with two reverts); agent icon chosen from concept F
  (`BotMessageSquare`, the chat says you can talk to it). Both concepts in
  `docs/archive/concepts/`.
- **Fix** (`5003fdf`): the j/k highlight stays only with focus in the list, before it
  looked like a second selection.
- **Favicon** (`e85ea97`): the same block as the logo cursor (1:2, sharp corners, glow).
- **M16, principles and sorting:** `docs/features/progetti.md` with principles, voice and
  sorting decided with Simone (showcase, registry, ideas, out). The repo is public and the
  agent reads its docs: no reserved name in the files.
- **M16, data:** `previously` field for the earlier iterations of an idea (#20), shown as
  "Before this", in the agent's index and searchable; `maintained` status for finished
  tools still in use (Portsage, Pigeon), with a steady green LED.
- **M16, entries:** sorting applied (Flux out of the showcase, ideas and excluded items to
  `published: false`); first drafts from the repo analysis for the new items and families
  (pgbee and Zeno in the showcase, Copilota, Edge Lab, Wavelength, Media Hub, Watch OS,
  IDKCraft, Milan, the servers, Maia, Minerd); the personal assistants become the
  iterations of Nexus. "The interesting choice" becomes "Why". The E2E tests no longer
  depend on the number of projects or tags.
- **Next step:** rereading the entries with Simone (hand-written text, "Why"), project
  covers, a skill that proposes the items from the repos.

## Cycle 22 - Icons in motion, content, agent in dev (2026-10-05)

Finishing touches on M15 and content (`645053f` .. `cfdbd49`).

- **Icons in motion** (`76329ed`, concept E in `docs/concepts/concept-e-icone.html`): on
  hover of the link that contains them the house jumps, the agent tilts its head, the
  arrows go out and come back, the projects' LEDs send out a ring, the copy tick draws
  itself. Pointer only: keyboard and touch stay still.
- **Now**, four rounds on Lucide's `Activity` line: it flickered because unitless lengths
  inside `calc()` made `stroke-dashoffset` jump (now in px, `069cc25`); then a heart
  monitor scroll (`73cb3c0`), redraw in a loop with a fade (`a574b79`), finally the choice
  of round 3 of concept E: the line traces itself from the left and retracts the same
  way, like a snake (`4e5c39a`).
- **Content** (`feed229`): path in the about page put back in order (a year of AI in
  Pavia, not concluded; coding courses for kids; Let's Code Italia then Ethicode; the
  software house with freelancing alongside); Ethicode starts at the end of 2022, not
  2023; the Relay item in Now without libghostty in the title.
- **Agent in `pnpm dev`** (`c1a1b94`): `env.ASSETS.fetch` on `assets.local` goes through
  Vite, which answered 403 to the unknown host, and the chat stayed offline. Now
  `allowedHosts` in `astro.config.mjs`; the deploy and `wrangler dev` are not touched.
- **Collection filters** (`63c8670`, `cfdbd49`): `Select`, active chips and "reset" in
  Departure Mono on the same veil as the list's search, in place of the sans controls with
  the border. In the options menu, tag search and "reset" sit inside the panel with
  concentric radii (`--radius-panel` 10px, margin 4px, `--radius-control` 6px); the active
  row uses the `hover` veil.
- **CLAUDE.md**: the redirect from `simonesalerno.it` is still to do; tighter design
  system (the why stays in ARCHITECTURE and #15-#16); gotcha of `pnpm check` under a
  running `pnpm dev`.
- **Next step:** unchanged, rereading the M16 entries with Simone, covers, a skill that
  proposes the items.
