# CLAUDE.md - simonesalerno.it

Portfolio personale: SvelteKit 2 + Svelte 5 (runes) + TS strict + Tailwind 4,
deploy su Cloudflare Workers. Contenuti file-based JSON, i18n hand-rolled EN/IT,
OG pre-generate. Il perché delle scelte sta in `docs/ARCHITECTURE.md`; stato e
log in `docs/ROADMAP.md` e `docs/CYCLES.md` (tienili aggiornati a fine ciclo).

## Comandi

- `pnpm dev` - dev server (vite) su :5173.
- `pnpm build` - catena: `validate-content` -> `generate-images` ->
  `generate-og-images` -> `vite build`.
- `pnpm check` - svelte-check (type check).
- `pnpm lint` - prettier --check + eslint. `pnpm format` per scrivere.
- `pnpm test:unit` - Vitest. `pnpm test:e2e` - Playwright. `pnpm test:ci` - tutti.
- `pnpm deploy` - build + wrangler deploy.

Giro di qualità prima di un commit non banale e SEMPRE prima di un push:
`pnpm lint && pnpm check && pnpm build && pnpm test:ci`. Non c'è CI remota: il
deploy avviene via Cloudflare Workers Builds al push, il gate di qualità è locale.

## Contenuti

- Vivono in `src/lib/content/` (config, pagine, `projects/<id>/`, `articles/<id>/`).
- Validati da Zod: schemi in `src/lib/schemas/content.ts`, tipi in
  `src/lib/types/content.ts`. Aggiungendo un campo aggiorna ENTRAMBI (schema +
  tipo), altrimenti type check o validazione falliscono.
- `ContentLoader` (`src/lib/utils/content.ts`) è l'unico accesso ai contenuti:
  cachea per istanza, carica le traduzioni lazy. Progetti e articoli passano per
  `loadCollection<T>`; non duplicare la logica nei wrapper.

## i18n

- Route `[page=lang]/[route=route]/[sub]`, matcher in `src/params/`.
- Redirect smart in `src/hooks.server.ts` (lingua/route/slug nella lingua
  sbagliata -> URL canonico) basati sulla slug map.
- La slug map (indice id -> slug per lingua) è DERIVATA a runtime dai contenuti in
  `ContentLoader.loadSlugMap` (memoizzata per isolate), non un file generato: gli
  slug vivono solo nelle traduzioni, non c'è niente da rigenerare o sincronizzare.
  In dev, dopo aver cambiato uno slug, riavvia il dev server.
- URL per lingua: usa `getLanguageUrl` (puro, testato). SEO (canonical/hreflang/
  JSON-LD): helper puri in `src/lib/utils/seo.ts`, cablati nel `+layout.svelte`.
- Logica di routing (lingua valida, route -> chiave logica, traduzione route,
  sezione) in `src/lib/utils/i18n.ts`: funzioni pure, unica fonte usata da layout,
  hooks e `getLanguageUrl`. Non reimplementarla inline. Il `ContentLoader` fa solo
  data-access, non routing.

## Open Graph

- PNG statici in `static/og/`, generati da `scripts/generate-og-images.ts`
  (satori -> resvg -> sharp) via `vite-node --config vite.og.config.ts`.
- NON committati (gitignored): artefatto di build, rigenerato a ogni build. In CI
  gli E2E richiedono che `pnpm build` giri prima (servono le OG su disco).
- Niente endpoint OG runtime. Il layout risolve un filename deterministico.
- Gotcha satori: font `woff`/`ttf` (mai `woff2`); dimensioni img nello `style`,
  non come attributi `width`/`height`.

## Design system

Sul branch `astro` il sito si sta rifacendo in Astro a parità di look (M14 in
`docs/ROADMAP.md`): finché la migrazione non chiude, quanto segue descrive la versione
SvelteKit. Branch `restyle/base`: look di `main` (Geist, fondo a gradiente blu-nero, card e
pillole) con i contenuti e lo schema del branch `restyle/laboratory` (progetti
ricurati, `eyebrow` nel welcome, voce). Il tentativo "Laboratorio" con telaio, keycap
e mono resta intero su `restyle/laboratory`, non mergiato: vision e motivi dello stop
in `docs/RESTYLE.md`, log in `docs/CYCLES.md` (Ciclo 9 e 10). Da qui si migliora lo
stile base senza snaturarlo; ogni pezzo del laboratorio si può ripescare da lì.

- Stile in `src/lib/styles/globals.css` (Tailwind 4, `@theme`). Font via Google Fonts
  in `app.html`, OG con `@fontsource/geist-sans` (satori vuole woff).
- Reveal-on-scroll con `svelte-inview` dentro ogni sezione. `MotionToggle` governa le
  animazioni (`data-motion` su `<html>`); il thumb dello switch è esentato
  (`.motion-thumb` in globals: Tailwind v4 anima `translate`, non `transform`).
- Navbar `fixed` più `FloatingNav` che compare allo scroll; `BackToTop` flottante.
- Shortcut tastiera (`+layout.svelte`): `1-4` -> sezioni, `0`/`Home` -> top,
  `End` -> fondo.

## Convenzioni

- `pnpm` sempre (mai npm/yarn). Tab, 100 colonne, single quote, no trailing comma
  (vedi `.prettierrc`, `.editorconfig`).
- Tailwind 4 CSS-first (`@theme` in `src/lib/styles/globals.css`), niente
  `tailwind.config`.
- Codice e identificatori in inglese, UI in italiano. Accenti italiani corretti
  (a e i o u con accento), mai apostrofo al posto dell'accento. Niente em dash,
  mai il carattere section sign.
- Commit: Conventional Commits in inglese, atomici (un'unità logica per commit).
  Push solo su comando esplicito.

## Non toccare senza motivo

- `PixelBlast` e le dipendenze `three`/`postprocessing` sono tenute apposta per
  una futura riattivazione dell'hero, anche se ora inutilizzate.
- CSP in `svelte.config.js` e header in `hooks.server.ts`: se aggiungi domini
  esterni (script/font/connect) aggiorna la CSP o verranno bloccati.
