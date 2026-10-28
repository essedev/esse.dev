# Cycles 17-18 (archive)

Cycles archived from `docs/CYCLES.md`, numbering intact. The earlier ones in
`CYCLES-1-6.md`, `CYCLES-7-8.md`, `CYCLES-9-10.md`, `CYCLES-11-12.md`, `CYCLES-13-14.md`
and `CYCLES-15-16.md`.

---

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
