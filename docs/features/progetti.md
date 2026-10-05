# Projects

How the site's projects are chosen and told (M16 in `docs/ROADMAP.md`). The entries are in
`src/content/projects/`, the showcase in `src/config/featured.json`. The repo is public
and the agent reads its docs: only what can be published goes here. Reserved items
(clients, other people's work, projects not to be named) are not written in any file of
the repo.

## Principles

1. **Ideas have a history.** A project is told with the iterations that preceded it, even
   the abandoned ones, for transparency: the same the site declares about working with AI.
   The iterations are data, not only prose (see the `previously` field below).
2. **Families, not isolated entries.** A recurring theme becomes a single item that tells
   the attempts in order, instead of many entries of a few commits.
3. **The real need is stated.** The personal context a project comes from ("since I moved
   to Milan") is worth more than a list of features.
4. **The status is honest.** An idea is an idea, a client site is a site; what has aged is
   updated before showing it, or stays hidden.
5. **Discretion where needed.** A skill can be told without naming the products: the
   crypto chapter talks about SolPlace and describes the rest without names.
6. **Ambitious ideas and measurement first.** Agent systems, harnesses that do not fool
   themselves, research with numbers: that is the profile. Client sites go at the bottom.

## Voice

Applies to the whole site: entries, pages, articles.

- First person, clean but young, short and direct sentences; technical terms where
  needed ("review", "prod"), without overdoing the jargon.
- AI-first and enthusiastic, never defensive: the human is not the brake that validates
  the AI, they design the system (architecture, context, checks) and that is why they can
  go fast. Engineering solidity is what allows delegating more, not what limits it.
- Banned: maxims of a seasoned craftsman ("the craft", "the value is not X, it is Y"),
  philosophical tone, LLM buzzwords (actionable, leverage), inflated metrics.
- Register by status: a real project is a technical story; an idea or a spike is a short
  entry (what, what I learned, why it stopped).

## The `previously` field

The earlier iterations of an idea, oldest first: `previously: [{ name, year, note }]` in
the frontmatter of each `<lang>.md`, with the same name and year in every language (the
build checks it) and the translated note. The entry shows them as "Before this", the
agent finds them in the index. Optional; the family's entry uses it for the attempts
that do not have an entry of their own. Why in the text and not in `meta.json`:
DECISIONS #20.

## Sorting

Decided with Simone on 2026-10-04 and applied in Cycle 21: every item has its entry, the
new ones in first draft.

**Showcase** (6): Relay, Nexus, pgbee, Zeno, mcpbelt, Portsage. Zeno is private: entry
without a link to the repo. The iterations of Nexus (`previously`) are Plannerinator, then
the personal assistants: Verbosa, NanoClaw, Life Terminal, Almanac, Nexus in Elixir, Bob,
which stopped the day Nexus restarted.

**Registry**:

- Copilota: a copilot for sales calls, macOS app in Swift with the backend inside the app,
  transcription of both channels, cards from the knowledge base, Nemotron locally. Private
  repo.
- Edge Lab (repo `printor`): where an LLM gives a real edge in trading, a harness built to
  resist self-deception.
- Wavelength: AI radio with a multi-agent newsroom.
- Media Hub (repo `home-media`): the home server and the TV app (see below).
- Watch OS: firmware for a smartwatch that is a voice client of an agent.
- IDKCraft: a voxel game in Kotlin, with IDKCraft Studio generating pixel-art textures
  via image models, with reference images to keep the style.
- Local LLM Experiments, a single item on local LLMs: Local LLM Eval and LLM Dash.
- Milan, a single item: based-routing (multi-origin trip planner on the Lombardy network)
  and Milanoz, with the context of the move to Milan in 2026.
- Personal servers, a single item: monitor (`status.esse.dev`) and server-ops.
- Experiments on Solana, a single item (folder `solplace`): SolPlace by name, the rest
  without.
- doppia.os: one of the first projects with AI, while the coding agents were arriving. The
  spring effect on window dragging, first written by hand in Svelte and then with AI;
  today something like this is a benchmark for local models. The story is the entry.
- Ethicode.
- Pigeon, Flux (leaves the showcase), Bu Do Kan (site on `budokan-v2`), L.R.L. Elettrica.

**Ideas**: Maia, with Cosmoscope and Upstream as earlier iterations; Minerd, the idle game
as the base of a game that updates itself with AI.

**Out**: Horizon and Casussy (almost no work), Templator (hidden until updated), Haystack,
CORE, Didattica Integrata, Kebabbivori, CamperPlan.

## Media Hub

It is told as the home server and the apps that use it, not as a torrent client: a
multi-app launcher on a single backend, a media server that starts the video while it
downloads (remux to fMP4 for the browser), an app for the Samsung TV (Tizen, sideloaded)
that replaces the CasaOS + Jellyfin stack. The protocol is named once, with no indexers or
sources.

Screenshots only from a demo instance with freely licensed films, loaded as files already
on disk (the library accepts them without going through search): the open films of the
Blender Foundation (Big Buck Bunny, Sintel, Tears of Steel, Spring) and the public-domain
ones from the Internet Archive. No poster of commercial films in frame, not even from the
metadata.

## Images

Every project page opens with a cover and has a logo beside the title and in the list row.
Both are files in the project's folder, declared in `meta.json` (`logo`, `cover` with its
`focus`) and validated by `image()`: a wrong path fails the build.

- **Cover, three sources, in this order.** A real screenshot of the interface; a designed
  mockup for projects with nothing to show (CLI, backend, firmware, idea), rendered with
  `scripts/render-cover.ts` from a `cover.json` kept next to it; the generated cover
  (accent veil and the Lucide `icon` from `meta.json`) when there is neither.
- **Screenshots only from demo data.** No real personal data, no client or company names,
  no copyrighted posters or third-party content, no paths of private repos. A screenshot is
  looked at before it is saved. Dark interfaces where the project has a dark mode.
- **Cover file**: WebP, at least 1600 px wide, at most 300 KB; it is cropped to 21:9 on
  desktop and 16:9 on mobile around `focus` (`top`, `center`, `bottom`).
- **Logo file**: always a tile, so the list reads as one row of icons and the logo stands out
  over a bright cover. An app icon that already is a tile (Relay, Copilota, Portsage) is used
  as it is, square and without margin; a free mark (pgbee, Zeno, Nexus, Budokan) goes on the
  shared tile with `scripts/render-logo.ts <mark-file> <accent>`; a project without a mark gets
  a Lucide glyph on the same tile (`render-logo.ts <lucide-name> <accent>`). Never a template
  favicon (Vite, Astro) and never the logo of a third party.
- **Weight**: no source file over 300 KB. The pixel-art archive cost 80 MB of history.
