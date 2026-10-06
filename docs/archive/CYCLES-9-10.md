# Cycles 9-10 (archive)

Cycles archived from `docs/CYCLES.md`, numbering intact. The earlier ones in
`CYCLES-1-6.md` and `CYCLES-7-8.md`.

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
