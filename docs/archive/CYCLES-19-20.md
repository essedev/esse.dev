# Cycles 19-20 (archive)

Cycles archived from `docs/CYCLES.md`, numbering intact. The earlier ones in
`CYCLES-1-6.md`, `CYCLES-7-8.md`, `CYCLES-9-10.md`, `CYCLES-11-12.md`, `CYCLES-13-14.md`,
`CYCLES-15-16.md` and `CYCLES-17-18.md`.

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
