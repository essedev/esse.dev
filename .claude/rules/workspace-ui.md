---
paths:
  - 'src/components/**'
  - 'src/layouts/**'
  - 'src/styles/**'
  - 'src/scripts/**'
  - 'src/lib/workspace.ts'
  - 'src/pages/**/*.astro'
  - 'docs/concepts/**'
---

# Design system: the workspace

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
- Two themes (DECISIONS #27): the `@theme` values are the dark, `:root[data-theme='light']`
  overrides them; `data-theme` is set before paint by `src/scripts/theme-init.js` (its CSP
  hash is computed in `astro.config.mjs`) and switched by `src/scripts/theme.ts`. A new
  color gets both values; what changes shape uses the `light:` variant. A project image with
  a light variant (`logoLight`, `cover.srcLight`) comes from the render scripts, which write
  both.
- The browser's bars take `--bar-top` and `--bar-bottom` (global.css), the wallpaper's edge
  measured on its frame: Safari 26 ignores `theme-color` and tints them from the html
  background. A change to the wallpaper, the desk or the CRT veil means measuring them again.
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
- Never native controls (`ui/Select.svelte`). Icons only Lucide, except the theme toggle
  (`ui/PixelIcon.astro`). A project's logo is content, not a UI icon: it lives in the
  project's folder (DECISIONS #22, rules in `docs/features/progetti.md`, Images).
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
- In Svelte a prop or a variable is not named like a rune (`state`, `derived`, `effect`,
  `props`): `$state(...)` becomes the subscription to a store and the page breaks at
  runtime, with no errors from `pnpm check`.
