# Decisions

Decisions that bind the future and had a real alternative that was rejected. Numbered
entries, citable as `#N`; status: `proposed`, `active`, `superseded by #M`,
`absorbed into <doc>`. What was done lives in `docs/CYCLES.md`.

The basic structural choices (JSON content with no DB, hand-rolled i18n, derived slug
map, OG at build time) are explained in `docs/ARCHITECTURE.md`; those on the visual
identity of the paused restyle (palette, font, hero, discarded pixel art) in
`docs/archive/RESTYLE.md`; the current style is #15.

The entries no longer active (superseded or suspended with the return to the base style
and the rewrite in Astro) are in `docs/decisions-archive.md`, with the same numbering.

## #1 - No remote CI, local quality gate

**Status:** active (Cycle 2, M6)

Deploy starts from Cloudflare Workers Builds on push. A GitHub Action had been added and
then removed: it would only have been informative and disconnected from the deploy. The
gate is `pnpm lint && pnpm check && pnpm build && pnpm test:ci` locally, always before a
push. Rejected: GitHub CI as the gate (it does not block the deploy, double source of
truth).

## #2 - Heuristic token estimate, no real tokenizer

**Status:** active (Cycles 5-6)

Tokens estimated from characters/divisor per language (~4 EN, ~3.5 IT), labeled "~",
code blocks counted only in tokens. A real tokenizer rejected: exact for a single model
(for Claude there is no public offline one) and the weight on the Worker bundle or the
move to build time, disproportionate for a decorative label.

## #3 - Home showcase from a config file, not from flags in the meta

**Status:** active (Cycle 7)

Selection and order of the projects on the home live in `config/featured.json`,
validated at build (existing ids, max 6). Rejected: a `featured` boolean in the
`meta.json` files (it gives no order) and a scattered `featured_rank` (fragile). Featured
applies only to the home: the listing stays neutral, ordered by date and filterable.

## #10 - Static Astro, Worker only for language and redirects

**Status:** active (Cycle 11)

The site is content, not an application: every page is prerendered and the Worker runs
only for the root (language from `Accept-Language`) and for a catch-all that makes a
single redirect to the canonical URL or answers 404. Each item is a shared `meta.json`
plus one Markdown per language, in two content collections joined by
`src/lib/content.ts`. Rejected: SSR of every page as in SvelteKit (compute and latency
for pages that do not change), Astro's i18n (it does not translate segments or slugs),
one JSON per language with the shared fields duplicated (drift between languages), the
body as JSON blocks (unreadable to write and in diffs). Since Cycle 14 the Worker also
routes `/agents/site-agent/*` to the agent's Durable Object (#11); the pages all stay
static.

## #11 - Site agent: the Agents SDK's PiHarness, models from OpenRouter

**Status:** active (decided in Cycle 13, confirmed by the trial in Cycle 14)

The agent runs on the server, never in the browser, in a Durable Object per visitor that
hosts pi-durable with `PiHarness` (`agents/harness/pi`, beta): conversation and resume
after a suspension are pi's, the Durable Object gives storage and wake-up. Models go
through OpenRouter (`src/agent/models.ts`): `glm-5.3-flash` on the fastest providers in
order (BaseTen, Fireworks, Parasail), with automatic fallback to the next. With Workers
AI the same question took about 40 s, with OpenRouter about 7. The interface is a Svelte
island with `AgentClient`. Rejected: Workers AI and AI Gateway (reduced catalog,
sometimes late, no choice of provider, credits needed anyway for third-party models),
Cerebras direct (today it serves only two models), pi-agent-core wired by hand (it
rewrote the durability of `PiHarness`), pi-server and pi-client (experimental), React
with assistant-ui (generic look, AI SDK format).

## #12 - Agent limits in real cost, with a triage in front

**Status:** active (Cycle 14)

Each visitor has a daily budget in dollars and the site a global cap
(`src/agent/budget.ts`, `Ledger` Durable Object): the real cost of each answer,
computed by pi-ai, is deducted, not the number of messages. Before the model, Jev (by
TypeSafe) classifies intent, weight and language in under a second: off-topic and abuse
stop there. It stops when the probability of being off-topic (off-topic plus abuse)
reaches 0.65, or that of abuse 0.5: thresholds fixed on the labeled messages
(`pnpm eval:jev`). Since Cycle 19 the `chat` intent (greetings, jokes, questions about
the agent) goes to the model and is not off-topic; the short answer with no tools
triggers only with `chat` at least 0.7, because a real question read half as chat must
search the site. The set is 76 messages with 10 attacks: 72 right decisions. If Jev does
not answer the request goes through: the cap in real cost remains the guarantee. Jev
goes through OpenRouter with the same key as the model; TypeSafe direct and Workers AI
remain as alternative transports (`JEV_TRANSPORT` in `src/agent/site-agent.ts`).
Rejected: a fixed number of messages per visitor (rigid, ignores how much a question
costs), triage alone without a cap (a classification can be fooled), chat stopped as
off-topic (a greeting received a curt notice). The budget per visitor is 10 cents a day
(it was 5: 3 questions with `delegate` were enough). In the page it is counted in
credits (1 credit = 0.01 cents, 1,000 a day) and the counter appears only below 30%:
visitors must not feel measured. Tokens and credits of each answer stay visible, the
cost in dollars in the tooltip.

## #13 - Code tools from the GitHub API, pages as cards

**Status:** active (Cycle 15)

The repo tools read GitHub's REST API (`src/agent/github.ts`): no workspace to keep,
calls of tens of milliseconds, read-only. The repo is a closed-value parameter (the
`repo` of the published projects plus the site's), and the code checks it again before
calling GitHub. The text of the repos is data, not instruction: the prompt says so, and
the tools have no effects to exploit. `GITHUB_TOKEN` is optional: without it, 60
requests an hour per IP and search only in file names. `show_page` shows a card instead
of opening the page: the site has no client-side router, and navigating would close the
conversation while the agent is answering. Rejected for now: `@cloudflare/computer` (it
clones the repos, really needed only to run code: to be reconsidered with `run_code`),
an `open_page` that navigates by itself.

## #14 - Demo tools: Code Mode in JavaScript, pi sub-agents, human-only sending

**Status:** active (Cycle 16)

`render` receives data and never HTML: the CSP blocks inline styles and scripts, and
model HTML would have to be sanitized. `run_code` uses Cloudflare's Code Mode in
JavaScript: Dynamic Workers accept Python too, but Cloudflare itself advises against it
for code generated on the fly (startup in the order of seconds against milliseconds),
and Code Mode exposes the other tools as typed APIs only in TypeScript. `delegate`
follows the sub-agent scheme of the pi-durable README (conversations owned by the call),
with only the read-only tools. `draft_message` does not send: the model writes the draft,
the visitor corrects it and sends it after Turnstile, and the server accepts only drafts
born from an agent call in the same conversation. Recipient in a secret, because the repo
is public. Each child of `delegate` has a cap of 12,000 tokens, with a pi extension
selected only on the children: once at the cap they answer with what they have. On the
comparison of three repos the cost dropped from about 140 to 93 credits and the time from
50 to 29 s. Rejected: Python for `run_code`, a send decided by the model, a destination
address written in `wrangler.jsonc`. Also rejected: removing tools based on the weight
estimated by Jev: the weight has never been measured against the real cost, and a
mistake would take `delegate` away from the questions that deserve it.

## #15 - Style from concept B: lavender, green only for live states, CRT veil

**Status:** active (Cycle 17)

Chosen with Simone on `docs/concepts/concept-b-stile.html`, which tuned palette, mono,
CRT effect and frame live. Lavender accent on a slightly cold black (palette G); a
phosphor green as second color with a single job, live or successful states, never on
running text. Departure Mono for all the interface mono, Geist Mono for code. CRT veil
(glow, fringe, lines, vignette) set only by the `--crt-*` variables. On a wide screen
list and content are two cards in a window; since Cycle 18 the window is there on mobile
too, with the pane only and the list in a drawer (before it was flush). The page change
is instant: the view transition looked like a site loading and slowed down the keyboard.
Rejected: the concept's other palettes (mint, purple, ultraviolet, amber, cyberpunk),
the other pixel monos (Geist Pixel, VT323, Doto and the others), the flat frame or the
window alone, the fade between pages.

## #16 - Glass from concept C: continuous veil, only the innermost glass blurs

**Status:** active (Cycle 19)

Chosen with Simone, variant B of `docs/concepts/concept-c-vetro.html`: the window on a
colored background, frame, list, pane, agent field and menus of glass (`glass`, values in
`--glass-*`), the top bar flat. The wallpaper is a continuous diagonal veil (`--wall`):
separate glows became blotches through the glass. No white veil on the glass, which turns
grey; `surface` and `hover` are light veils, not solid greys; a text color is measured on
the glass, not on black. In Chromium a blurring glass inside another stops blurring: the
frame has only the border, the pane blurs from a layer (`data-pane-glass`) behind the
content instead of from the pane itself. Rejected: white veil, separate glows, glass top
bar (Simone did not want it), the refraction of variant C (Chromium only), blur on every
level.

## #17 - Agent limits per IP too, with a daily fingerprint

**Status:** active (Cycle 19)

The visitor id is chosen by the browser, so its cap (#12) is bypassed by changing it.
Each IP has a burst of 10 messages a minute (Workers Rate Limiting, binding
`AGENT_RATE`), checked before Jev, which is paid for even on the messages then stopped,
and a budget of 50 cents a day in the `Ledger` (`IP_DAILY_USD`): five visitors, because
offices and mobile networks put many people behind one address. The key is a SHA-256
fingerprint of day and IP: the address is not stored, and fingerprints of different days
are not linked. Rejected: the per-visitor cap alone (bypassable), the IP in clear, a
per-IP cap equal to a visitor's (it would cut shared networks).

## #18 - No allowlist of external links in the answers, for now

**Status:** active (Cycle 19)

The agent's answers can contain links to any domain, unfiltered. A malicious link in the
answer is useful to someone who can have the agent read a text of their own and then show
the answer to someone else: today the agent reads only the site and Simone's repos, and
the conversation is seen only by whoever wrote it. Rejected for now: a domain allowlist
in the transcript renderer (complexity and useful links cut, with no risk to cover). To
be reviewed when conversations become shareable or the agent reads third-party content
(URL fetch, repos not Simone's).

## #19 - OG in the terminal style, favicon with the cursor alone

**Status:** active (Cycle 20); the favicon superseded by #26

From concept D (`docs/concepts/concept-d-og.html`). The sharing images are direction B:
the command that opens the page (`whoami`, `ls progetti`, `cat progetti/relay.md`), the
big title with the lavender cursor, the excerpt, metadata and domain in Departure Mono,
light CRT lines. Generated at build as static PNGs (satori and resvg in the Node
prerender): nothing runs on the Worker. Rejected: A, the miniature window (too many
details that get lost at preview size), and C, the typographic one (clean but detached
from the site). The favicon is the logo cursor with a glow: rejected the "e" (the initial
of the domain, with no reason), the "s" (the name of the letter, but a letter remains a
common choice), the tilde of the path and the laboratory hat. The files are generated
with `pnpm favicons`.

## #20 - A project's earlier iterations as data, in the text per language

**Status:** active (Cycle 21)

An entry also tells the attempts that preceded it (`docs/features/progetti.md`), and
keeps them as data: `previously: [{ name, year, note }]` in the frontmatter of
`<lang>.md`, shown as "Before this", passed to the agent's index and searchable by name.
It lives in the text and not in `meta.json`, against the initial plan and the "facts in
the meta" rule, because the note is prose to translate; name and year are facts, and
`src/lib/content.ts` fails the build if they diverge between languages. Rejected:
`meta.json` with the note in every language (prose outside its file), the iterations only
in the body (neither searchable nor visible to the agent as a list), an entry for each
attempt (many items of a few commits instead of a family).

## #21 - In a public repo, a reserved project is deleted, not unpublished

**Status:** active (Cycle 23)

The repo is public and the agent reads its docs, so `published: false` hides a project
from the site but not from anyone reading the files. A project that must not be named
(unpublished crypto experiments, work that depends on third parties, internal mockups) is
deleted from the working tree; git history keeps it if it comes back. A project that is
only out of the portfolio still goes to `published: false`, as #6 said. Rejected:
`published: false` for everything (the name stays readable), rewriting history (the repo
is already public and cloned, a rewrite removes nothing).

## #22 - Every project page opens with a cover, and every project has a logo

**Status:** active (Cycle 23)

The page opens with a 21:9 cover (16:9 on mobile) and the logo rises over its bottom edge,
from concept F, variant B. The cover is a real screenshot from demo data, a designed mockup
rendered by `scripts/render-cover.ts`, or a generated one (accent veil and Lucide icon), so
no page opens on a hole. A project's own logo when it has one, otherwise a designed tile
from `scripts/render-logo.ts`; in the list it takes the LED's place, with the LED on its
corner so the status stays. Files sit in the project's folder and go through `image()`, so a
wrong path fails the build. A logo is content, not a UI icon, so it does not break "icons
only Lucide". No text in a cover: the name, tagline and command drawn into a mockup repeated
the heading and excerpt below it and stayed in English on the Italian pages, so a designed
cover is a single centered panel. Rejected: logos of the technologies (a wall of badges,
colors against the lavender), the cover only where a screenshot exists (half the pages would
open bare), screenshots in the side column (variant C, the page loses its opening).

## #23 - Agent conversations expire after 90 days, the privacy notice names categories

**Status:** active (Cycle 24)

A visitor's conversation is kept 90 days from the last message (`RETENTION_DAYS` in
`src/agent/retention.ts`), then a Lifecycle job empties the whole object: transcript, drafts,
spend. "Nuova conversazione" restarts the context and does not delete. The privacy notice
states the same number: changing one means changing the other. The notice names categories
(an AI model, providers in the United States, a server in the EU), not the model, the
providers, the server's location or the storage keys, which change with the code and would
make the page go stale silently. Umami is cookieless, so no consent banner. Rejected: the
notice listing those details.

## #24 - Agent states and error pages from concept G

**Status:** active (Cycle 25)

The agent page shows the phase of the work in a single status line under the answer, read
from the state the client already has (`phaseOf` in `src/agent/phase.ts`): a new state is
derived there, not added as a server event. The phase decodes from block glyphs (variant B);
the streamed words glow in the accent and cool down. Errors are shown by kind in the
visitor's language, the raw text only under "details", since pi's and the providers' wording
is not a contract. The 404 and the 500 are one family, the number as a disturbed CRT signal:
the 404 suggests the closest pages, the search and the agent; the 500 fills the digits with
noise and shows only the request id. With reduced motion they follow #25, and no new
blinking cursor. Rejected: a rotating quadrant (A) or an oscilloscope trace (C)
for the phase, a terminal-style 404 (A), a 500 identical to the 404 (A) or losing vertical
hold (C), a plainer 500 (too far from the 404).

## #25 - Reduced motion removes displacement, not feedback

**Status:** active (Cycle 25)

`prefers-reduced-motion` is respected, but it stops what moves through space, not every
animation. Whoever turns it on may have vestibular disorders, migraine or attention
issues, and what hurts is displacement: things that jump, slide, rotate, scale or shake.
Color, opacity, strokes that draw themselves and text that changes in place carry none, so
they keep running: phosphor, LEDs, the logo's caret (under 3 Hz), the decoding labels, the
hover colors, the redrawn strokes of the icons. What translates, rotates or scales gets an
equivalent that stays put: an icon's gesture becomes a glow in the accent (the bot's eyes
blink by opacity, the LED's ring lights up without widening), the error number keeps its
fringe but still, the 500's snow stops, the mobile drawer fades instead of sliding, smooth
scrolling becomes instant. Rules in the `prefers-reduced-motion` block of `global.css` and
the `motion-safe:` variant in components; checked by `tests/e2e/motion.spec.ts`. A new
animation picks its side there. Rejected: the global `animation: none; transition: none`
it replaced (the site got poorer for no reason and anyone with the setting on, often just
to calm the OS, lost details without knowing), ignoring the preference, a switch in the
site to override it (machinery, and the OS setting is where the visitor already said it).

## #26 - Favicon with the tilde of Departure Mono

**Status:** active (Cycle 25)

The favicon becomes the `~` of the site's root, as in the breadcrumb ("~ / agente"), in
place of the logo cursor that #19 chose: the cursor already lives in the logo next to the
tab, the tilde says where you are. Same style: lavender with a glow on the dark tile. The
glyph is Departure Mono's own (5x3 pixels), drawn with cells of 4 units on the 32 grid, so
at 16 px each cell is exactly 2x2 pixels and the mark stays sharp, like the cursor was. From
concept H (`docs/concepts/concept-h-favicon.html`), variant A. Rejected: a smooth hand-drawn
tilde (B, reads better at 16 px but leaves the logo's pixel language) and Geist Mono's glyph
(C, heavy, with drop-shaped ends). Generated by `scripts/generate-favicons.ts`.

## #27 - A light theme, chosen by the system or by a toggle

**Status:** active (Cycle 26)

The site gets a light theme: the same lab by day, at dusk. A muted violet wallpaper, the
glass a lilac grey and never white, ink almost black with a violet cast, the accent down to
`#5f40d6` and the minimum text grey to `#57526a` (4.7:1 where the glass is lightest,
measured), `live` to `#179a4c`. From concept I (`docs/concepts/concept-i-chiaro.html`),
variant C: the first version, white glass on lavender paper (X), read as too white, the
violet only in the wallpaper; rejected all lilac (A, list and pane one tone) and violet
structure with a white pane (B). The CRT veil stays and turns into print:
dark scan lines, a lighter vignette, a thinner glow, the error number's fringe in `multiply`
instead of `screen`. The dark values stay the tokens' own in `@theme`; the light ones
override them under `:root[data-theme='light']`, and the white and black that were written
by hand (grid, scan lines, glass edge, vignette, LED, covers) now go through variables
(`--veil-rgb`, `--shade-rgb`, `--glass-edge`...), so the dark theme did not move.

The theme follows the system until the visitor picks one with the toggle in the toolbar,
next to the languages; a pick equal to the system's is not saved, so the site goes back to
following it. `data-theme` is set before the first paint by `scripts/theme-init.js`, inline
in the head, or a light screen would flash dark: Astro does not hash inline scripts, so
`astro.config.mjs` computes the hash from the same file. The toggle's sun and moon are drawn
on the 9-pixel grid of Departure Mono (`ui/PixelIcon.astro`, 2x2-pixel cells at 18 px), the
logic of the favicon (#26): the one exception to "icons only Lucide", so that the toggle
reads as part of the toolbar's mono rather than as one more line icon. On hover the sun's rays take
turns and the moon's star twinkles, by opacity, so with reduced motion too (#25). Rejected:
only `prefers-color-scheme` (no way to pick on a shared screen), a three-state toggle with
"system" (one more state to explain for a choice the two-state one already undoes),
`light-dark()` on every token (it does not cover the channel variables like `--veil-rgb`).

## #28 - Project images in both themes, from the render scripts

**Status:** active (Cycle 26)

The logos made by `scripts/render-logo.ts` and the designed covers made by
`scripts/render-cover.ts` come in two: the dark one and a `-light` one, declared in
`meta.json` as `logoLight` and `cover.srcLight`; the page shows the one of the theme. The
light logo is a light tile tinted with the bright accent, stronger than the dark one, with a
hairline; the glyph on it in the accent darkened to the lightness of the site's light accent
(`scripts/light-accent.ts`, OKLCH, hue kept); a mark stays as it is. The light cover puts the
same panel, almost white, on a mid lavender ground a step under the glass, with the
darkened accent: the first version, panel and ground both near the glass's tone, stood
1.01:1 against the pane and melted into it, the tiles too. Both scripts always write both, and `render-logo.ts --light` reads an
existing logo back from its SVG, since the arguments it was made with are not kept. When a
cover has two variants both load lazily, so only the shown one is fetched (an eager image
hidden by CSS is fetched all the same), at the cost of starting after layout. Not in two:
the app icons that are already a tile (Relay, Copilota, Portsage), which are the apps' own,
the screenshots, which are the real interface, and the OG images, which are seen outside
the site. The generated cover follows the tokens already.
