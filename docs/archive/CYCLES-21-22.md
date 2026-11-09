# Cycles 21-22 (archive)

Cycles archived from `docs/CYCLES.md`, numbering intact. The earlier ones in
`CYCLES-1-6.md`, `CYCLES-7-8.md`, `CYCLES-9-10.md`, `CYCLES-11-12.md`, `CYCLES-13-14.md`,
`CYCLES-15-16.md`, `CYCLES-17-18.md` and `CYCLES-19-20.md`.

---

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
