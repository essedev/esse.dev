# Cycles

Chronological log of the project's work cycles. Each cycle records goal, work done (with
commit references), checks and what remains. It serves to pick up the thread between one
session and the next. High-level planning lives in `docs/ROADMAP.md`.

Older cycles are in `docs/archive/` (Cycles 1-6 in `CYCLES-1-6.md`, 7-8 in
`CYCLES-7-8.md`, 9-10 in `CYCLES-9-10.md`, 11-12 in `CYCLES-11-12.md`, 13-14 in
`CYCLES-13-14.md`, 15-16 in `CYCLES-15-16.md`, 17-18 in `CYCLES-17-18.md`).

---

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

## Cycle 23 - Public repo, production, covers and logos (2026-10-05)

From the public repo to production, then the M16 covers (`2f6abed` .. `e96fe80`).

- **Public repo:** renamed `essedev/esse.dev` (Worker and package stay `simonesalerno`);
  MIT for the code, content and visual identity excluded at the top of `LICENSE`. Docs,
  comments and test names in English, README mirrored in `README.it.md`,
  `docs/CONVENTIONS.md` with language and glossary; `pnpm lint` runs
  `scripts/check-prose.py` and requires doc comments on the exports of `src/lib` and
  `src/agent`. `eslint-plugin-jsdoc` stays at 61: 65 needs Node 22.22.2 or 24.15, and with
  `engine-strict` an older Node 22 would fail the install.
- **Reserved content** (`49c2e71`): unpublished projects, two archived mockups with
  internal material and the personal notes leave the working tree (#21 supersedes #6).
- **Production:** `astro` reaches `main`, the restyle and `astro` branches go to a bundle
  outside the repo; the pixel-art PNGs left the unpushed history, so the commits cited in
  these cycles were remapped. First Astro deploy from `main` with Workers Builds.
- **Finishing touches:** `/llms.txt` built from the collections (before it fell into the
  catch-all redirect); profile links with a 24 px touch target (flagged by Lighthouse);
  the pane on the same glass as the list, which read as a greyer material.
- **Covers and logos (#22):** `scripts/render-cover.ts` (mockup from a JSON spec) and
  `scripts/render-logo.ts` (tile with a Lucide glyph or the project's own mark). Every
  project page opens with a cover, the logo rises over its edge and takes the LED's place
  in the list. Screenshots from demo data where an interface exists, designed mockups for
  the five with nothing to show. Short rounds after: every logo a tile, the shadow follows
  the logo's shape, no text in a designed cover (it repeated the heading and stayed in
  English on the Italian pages), Budokan's cover tried on four sections of its site.
- **Content:** the Nexus lineage from Plannerinator and Life Terminal to Elixir; Ethicode no
  longer links to a domain now serving another product.
- **Next step:** rereading the M16 entries with Simone, a skill that proposes the items.

## Cycle 24 - Analytics, privacy notice, conversations that expire (2026-10-06)

Mobile fixes, then what the site collects and for how long (`fa4e6a6` .. `7ce1c79`).

- **Mobile:** pager links side by side with titles on two lines; pane and drawer rounder
  and closer to the screen corners.
- **Analytics:** `essedev.it` expired, so Umami moves to `analytics.esse.dev`, self-hosted,
  with neutral names for script and collect endpoint (the defaults are in the ad blockers'
  lists); the CSP changes in the same commit, or the browser blocks the script silently.
  Custom events in `src/scripts/track.ts`: where an agent message comes from, notices,
  errors, drafts sent, copies, the host of an outbound link. Never the visitor's text.
- **Retention (#23):** a conversation expires 90 days after the last message
  (`src/agent/retention.ts`). A Lifecycle job moved on every settled turn empties the
  object: alarms off, storage deleted, instance reset. Conversations from before get a
  deadline at their next start. "Nuova conversazione" does not delete.
- **Privacy notice (#23):** a single page in both languages, linked from the list's status
  line and under the agent's field, in the sitemap, `llms.txt` and the agent's index, so
  the agent answers "do you keep my messages?" from the notice. Then a summary on top and
  categories instead of model, providers, server location and storage keys.
- **Content:** Budokan is the Next.js rewrite, the SvelteKit site goes to `previously`.
- **Next step:** the Open items of the ROADMAP (redirect from `simonesalerno.it`, the
  `hello@esse.dev` mailbox) and the production secrets for `draft_message`.

## Cycle 25 - Agent states and error pages from concept G (2026-10-06)

What the visitor sees while waiting and when something breaks (`3a9964a` .. `e39bf1c`),
from concept G (`docs/concepts/concept-g-stati.html`, #24).

- **Agent at work:** the only wait state was "thinking", gone at the first token, and errors
  arrived raw in English. A status line under the answer now follows the real phase (Jev,
  thinking, reasoning, the tool at work, writing, retry with countdown), read by
  `phaseOf` in `src/agent/phase.ts` from what the client already receives; the phase decodes
  from block glyphs into the word (`AgentStatus.svelte`). The streamed text is born in the
  accent and cools to the text color (`phosphor.ts`).
- **Recovery states:** a resumed conversation, a dropped and restored connection, and errors
  by kind (`errorKind`: provider, timeout, aborted, internal) in the visitor's language,
  with the raw text under "details". E2E in `tests/e2e/agent-states.spec.ts` against a fake
  socket (`routeWebSocket`), with no model calls.
- **Edge states:** a message sent during an answer waits under it, marked as queued
  (`view.queued`), with the status line above it; a socket that never opens says so after
  8 s; before hydration the field is already in place, disabled (`AgentFallback.astro`, the
  `client:only` fallback), with a `<noscript>` line; a conversation that expires with the
  page open comes back empty. Cloudflare's own error pages (a Worker that throws outside
  Astro) stay as they are: custom error rules need a paid plan.
- **Reduced motion:** the global `animation: none; transition: none` turned off everything,
  colors and phosphor included. Now only displacement stops and gets an equivalent that
  stays put (icons glow, the error number keeps a still fringe, the drawer fades), #25;
  `tests/e2e/motion.spec.ts` checks both sides.
- **Favicon:** the tilde of Departure Mono in place of the cursor, same style, from concept H
  (A), #26; `pnpm favicons` regenerated the set in `public/`.
- **404:** the number as a disturbed CRT signal; the catch-all computes on the Worker the
  pages closest to the wrong path (`src/lib/suggest.ts`, edit distance on routes and slugs)
  and offers the list search (`?q=` with the words of the path) and the agent (`?ask=`).
- **500:** it did not exist (Astro's default page). `src/pages/500.astro`, on the Worker,
  logs the error with the `cf-ray` id and shows only that id to quote, with the digits full
  of snow: same family as the 404, the noise says the fault is on the site's side.
- **Next step:** the Open items of the ROADMAP and the production secrets for
  `draft_message`.

## Cycle 26 - A light theme, and more light in the dark one (2026-10-08)

The site in two themes, then the project images and the dark theme to match (`90fc3bb` ..
`7615ce6`), from concepts I, J and K (`docs/concepts/`).

- **Light theme (#27):** the same lab by day, from concept I, variant C: muted violet
  wallpaper, lilac grey glass (the first version, white glass on lavender paper, read as too
  white), accent `#5f40d6`, minimum text grey `#57526a` at 4.7:1 where the glass is
  lightest. The CRT veil turns into print. The light values override the `@theme` ones under
  `:root[data-theme='light']`; the white and black written by hand go through variables
  (`--veil-rgb`, `--shade-rgb`, `--glass-edge`), so the dark theme does not move.
- **Choice of theme:** it follows the system until the visitor picks one with the toggle in
  the toolbar; a pick equal to the system's is not saved. `src/scripts/theme-init.js`, inline
  in the head, sets `data-theme` before the first paint, with its CSP hash computed in
  `astro.config.mjs` from the same file; `src/scripts/theme.ts` flips it and updates
  `theme-color`. The sun and moon are pixel icons (`ui/PixelIcon.astro`), 1 px cells on a 15
  grid from concept J, variant B (the 2 px cells were coarser than Departure Mono): the one
  exception to "icons only Lucide".
- **Project images in both themes (#28):** `render-logo.ts` and `render-cover.ts` write a
  `-light` variant next to every logo and designed cover, the accent darkened in OKLCH
  (`scripts/light-accent.ts`), declared as `logoLight` and `cover.srcLight`. The first light
  cover stood 1.01:1 against the pane and the tiles melted into the list: the ground goes to
  a mid lavender, the tiles take the bright accent's tint. App icons, screenshots and OG
  images stay single.
- **Dark theme (#27):** more light from concept K, variant A: the desk to `#0a0912`, the
  wallpaper's veil and point of light doubled, the surfaces unchanged.
- **Finishing touches:** the home's suggestions always below the intro (two columns ended
  halfway down a tall pane); the Turnstile widget drawn in the site's theme.
- **Tests:** `tests/e2e/theme.spec.ts`: system theme, toggle that survives a reload, back to
  the system, logo and cover of the theme.
- **CLAUDE.md:** the two themes in the design system; gotcha of an edited `meta.json`
  invisible in dev (`.astro/data-store.json`).
- **Next step:** unchanged, the Open items of the ROADMAP and the production secrets for
  `draft_message`.

## Cycle 27 - Agent mail, Safari's bars, the home, a tab bar on phones (2026-10-08 / 2026-10-12)

`draft_message` in production, then phones and the home from concepts L and M (`6ae5c18` ..
`72a08c5`).

- **Agent mail:** `hello@esse.dev` confirmed as `MAIL_TO`, sent through Cloudflare Email
  Service and not Email Routing, which would take the MX of the domain's mail (Qboxmail).
  The real Turnstile site key lives in the code, chosen by host (`turnstileSiteKey` in
  `src/agent/draft.ts`): it is public, and dev, preview and the E2E tests run on localhost,
  where the real widget refuses to load; a key set at build still wins.
- **Delivery note (#29):** after a send or a failure the server writes a note for the model
  into the conversation, without a run, so the agent answers "was it sent?" right; the page
  drops the entry.
- **Safari's bars:** Safari 26 ignores `theme-color` and tints its bars from the html
  background or from a fixed element on each edge. The html background becomes the
  wallpaper's edge, measured on its frame (`--color-bar-top`, `--color-bar-bottom`); on phones
  two solid fixed strips carry the edge colors and the closed drawer backdrop leaves the
  page, since Safari samples it even at opacity 0. The window stays still and only the pane
  scrolls, so the bottom bar never shrinks (rule in `.claude/rules/workspace-ui.md`).
- **Touch:** no zoom on double tap (`touch-action: manipulation`, on the pane too) or on
  focusing a field (16 px on touch screens); one short placeholder for the agent, "Ask me
  anything", and a one-line privacy note under its field.
- **Agent:** "the site" means the esse.dev repo when the question is how it is built; a
  conversation coming back shows only its loading line.
- **Content:** Wavelength hidden while it is rebuilt for a hackathon. The LED legend moves
  from the sidebar's status line to the projects list, only for the statuses it contains.
- **Home (#30):** concept L (`docs/concepts/concept-l-home.html`), variant G. The name goes
  to a status line (still the h1), the largest line is what Simone does; the welcome text
  lives in the frontmatter (`headline`, `intro` with the logos of `tools`). "Where to start"
  becomes three equal cards: the agent with its first question, the lead project on its
  cover, the method with a `quote` from its notes. Three short rounds on the shadow of the
  stacked logos, which ended as a light drop-shadow following their shape.
- **Mobile navigation (#31):** concept M (`docs/concepts/concept-m-nav-mobile.html`),
  variant C. A tab bar under the pane (`TabBar.astro`) with Home, Projects, the agent raised
  at the center, Method and Menu; Menu opens the list as a sheet from below in place of the
  drawer from the left, and the toolbar loses the index button and the magnifier. A tap
  plays the tab icon's gesture (`data-play`), the sheet's blocks rise in turn.
- **Tests:** unit on the Turnstile key by host and on the headline's accent
  (`emphasis.test.ts`); E2E on the tab bar and the sheet in `navigation.spec.ts`.
- **Next step:** the Open items of the ROADMAP; the tab bar and Safari's bar colors on a
  real iPhone.

## Cycle 28 - The domain move, a readable sitemap, the agent reads its credits (2026-10-12)

Finishing touches after the move to `esse.dev` and one agent gap (`88cccde` .. `bed0389`).

- **Redirects:** `simonesalerno.it` and `www` go to `esse.dev` with a Cloudflare Redirect
  Rule that keeps path and query string. The catch-all's redirect to the canonical URL
  becomes a 301 (it was a 302): the target depends only on the path, and the old URLs,
  those from `simonesalerno.it` included, pass their ranking on (#10). Search Console
  stays to do (ROADMAP, Open).
- **Sitemap in a browser (#32):** it opened as raw XML. An `xml-stylesheet` instruction
  points to `/sitemap.css` (`src/pages/sitemap.css.ts`), CSS on the XML and not XSLT, which
  Chrome removes from stable on 2026-11-17. The stylesheet is generated at build from the
  color tokens of both themes in `global.css` (`src/lib/css-tokens.ts`) and Departure
  Mono's URL from the Fonts API: a renamed token fails the build instead of drifting.
- **`get_budget`:** asked for its credits, the agent searched the site's code twice and
  still could not tell the balance. The prompt now states the credit rules, `get_budget`
  returns the credits left like the page's counter (the lowest of visitor, IP and site),
  and Jev puts these questions in `chat`, whose short mode allows only this tool (#12).
  Three new cases in Jev's set.
- **Tests:** unit on reading the tokens (`css-tokens.test.ts`) and on `get_budget`; E2E on
  the 301s and on the styled sitemap.
- **Next step:** Search Console for `esse.dev`; the Open items of the ROADMAP.

## Cycle 29 - Sub-agents in the background, on the field (2026-10-27)

`delegate` stops holding the main turn, then the page shows the children from concept N
(`d3839b3` .. `40ee4a8`).

- **Background (#33):** `delegate` starts 1 to 3 sub-agents owned by a background anchor
  and returns at once, so the visitor keeps talking. A reporter task per child waits for
  the answer, charges it and posts the findings as a new message that starts a turn; a
  stopped child, or a report with no credits left, becomes a model-only note. Each child's
  worst case is held back from the budget while it works, at most 3 work at once, and a
  `sub-agents` prompt section gives the model their real state. A child's session is
  read-only on the socket (watch and stop); a reset stops the children first. One child
  is now allowed (the minimum was 2). Measured in preview: one child on a file, main
  answer in 7 s, report in 14 s, about 15 credits.
- **On the page (#34):** concept N (`docs/concepts/concept-n-subagenti.html`), variant B,
  simulated on a real preview conversation in both themes at 390 px. The children sit as
  chips on the field's glass panel and as rows of the `delegate` card; either opens the
  child's transcript live in a sheet above the field (`ChildSheet.svelte`), on the child's
  own read-only socket, with Stop and Esc, while the field stays usable. A report reads as
  its own line with the findings folded, never as the visitor's message, and does not
  count as one. A reset also empties the children list.
- **Tests:** unit on the held-back reserve, the report round-trip (`parseReport`), a single
  task passed without the array and the prompt section; an E2E in `agent-states.spec.ts`
  with chips, live sheet and report line on the fake socket.
- **Next step:** the sheet's height on phones (chips and field leave it about half the
  screen); the Open items of the ROADMAP.

## Cycle 30 - Projects refreshed, a changelog, the boot, the chat by turn (2026-10-27)

Projects, a page for visitors, the first visit and the agent page, after the sub-agents of
Cycle 29 (`be295b9` .. `f247b2f`).

- **Projects (M16):** Relay, Media Hub and Nexus brought up to date with new covers; Watch
  OS retold on ESP-Brookesia, in progress again, the C version in `previously`. Varco joins
  the showcase in Portsage's place, with its map and share image as cover, and the Milan
  entry folds into it as its `previously`; Floppy enters the registry, then the showcase in
  mcpbelt's place, covered with its landing hero. pgbee's cover is a frame of its video.
- **Changelog (#35):** a hand-written `changelog` collection, one entry per release, at
  `/en/changelog` and `/it/modifiche`, linked in the status line and in the agent's index;
  the history rebuilt from git and the cycles.
- **Sub-agents that talk (#36):** a `tell` tool tried on `spike/subagent-tell` and kept off
  main: no child called it on its own, and a late message replaced the findings.
- **Boot (#37):** concept O (`docs/concepts/concept-o-avvio.html`), variant D with D1. The
  first visit boots the site like a computer (about 6 s of log with the site's real data,
  then the interface loading as a skeleton); a new release or a week away gets the short
  boot naming the changelog entries not seen; any input skips it. Decided inline before the
  first paint, so the headline stays the LCP.
- **Home:** "Where to start" pinned to the bottom of the pane on tall screens.
- **Agent page (#38, #39):** concepts P and Q. The empty page shows three abilities with
  the token each becomes, in place of the tools by name; the chat reads by turn, the
  question in a lilac bubble, the work under one header as tokens with a sentence and what
  came back. A sub-agent's sheet uses the same tokens (`StepToken.svelte`,
  `StepDetail.svelte`) on a lighter veil. Fixes: the sheet takes the answers' typography,
  `delegate`'s arguments are read through `delegateArgs` as the server does (no more
  "affida 0 lavori"), short status labels, and the children numbered 1, 2, 3 in the
  conversation instead of by the object's id.
- **Dev:** Cloudflare quick tunnels allowed as dev server hosts.
- **Tests:** unit on the step sentences (`steps.test.ts`); E2E on the boot
  (`boot.spec.ts`), the turn view and the sub-agent tokens (`agent-states.spec.ts`) and the
  changelog page (`workspace.spec.ts`).
- **Next step:** the sub-agents' sheet on phones; rereading the project entries with Simone;
  Search Console for `esse.dev`.

## Cycle 31 - Tidier on phones (2026-10-28)

Layout fixes below 640 px and on the tab bar (`c4b0f35` .. `660572f`), with the changelog
entry `2026-10-28-mobile` (merged into `2026-10-28-pagine` with Cycle 32, one entry per release).

- **Toolbar:** its side padding follows `--pad`, the pane's text margins, at every width.
- **Tab bar:** a lighter glass on phones (`bg-panel/55`, no glass shadow).
- **Agent field:** its distance from the bottom of the pane is `--dock-gap` in
  `global.css`, 1.25rem below `lg` so the field clears the agent disc rising over the tab
  bar, 0.75rem from `lg`; shared by `AgentChat.svelte` and `AgentFallback.astro`.
- **Home:** the facts stack value under label below `sm`; the label column left the values
  about 200 px and every line wrapped.
- **Projects:** the list's filters share one row on phones (`CollectionBrowser.svelte`).
- **Next step:** unchanged from Cycle 30.

## Cycle 32 - The listing pages rebuilt: projects, method, now, about (2026-10-28)

Four concepts, one per listing page (`f0de0b8`), each chosen with Simone and built in a
commit of its own (`7d612fe` .. `d757d3a`); one changelog entry for the release
(`d3cd62a`).

- **Projects (#40):** concept R, variant C. Grouped by status: in progress as wide rows
  with the cover, the showcase first with its badge; maintained and completed, ideas and
  archived as compact rows with the logo. The groups replace the status filter; covers and
  logos resolved at build (`project-pictures.ts`).
- **Method (#41):** concept S, variant A. Each note's line in large type next to up to three
  proofs (`proofs` in the frontmatter: a project, a page or a public URL, each with a note),
  checked at build. Every note has a `quote` now; the home's card takes the one named in
  `featured.json` (`method`).
- **Now (#42):** concept T, variant D. A dated note by hand, then the site and the projects
  in progress with their `now` line, eight weeks of commits and the last one, moved to
  "Paused" after 21 days idle. Read from GitHub at build, dates and counts only, private
  repos through `activityRepo` and `GITHUB_ACTIVITY_TOKEN`, separate from the agent's
  token; an unreadable repo falls back to `updated` in `meta.json`. A new dated note
  (`2026-10-sito-varco`); a note's `project` is optional now.
- **About (#43):** concept U, variant A. `lead`, `path` (steps with `when`, title, note,
  optional project) and `certification` in the frontmatter, also in the agent's index; an
  optional `photo` that opens the "Scrivimi" column, none shown until there is one.
- **Changelog:** the phone fixes' entry merged into `2026-10-28-pagine`, one entry per
  release (#35).
- **Tests:** unit on grouping (`listing.test.ts`) and on weeks, pause and bars
  (`activity.test.ts`); the listing E2E follows the groups.
- **Next step:** the photo and its position; `GITHUB_ACTIVITY_TOKEN` in the Workers Builds
  variables, without it production reads only the public repos; Zeno's repo (none under
  `essedev`, so its date is `meta.json`'s); Copilota's private repo is not read, so it shows
  a `meta.json` date; rereading the method's lines and the projects' `now` lines with
  Simone.
