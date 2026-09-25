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

## Design system (restyle "Laboratorio")

Rebrand visivo in corso sul branch `restyle/laboratory` (non ancora mergiato). Vision
e decisioni in `docs/RESTYLE.md`, log in `docs/CYCLES.md` (Ciclo 9). In sintesi:

- Font: **Martian Mono** per lo strumento (hero, nav, titoli di sezione, etichette,
  tasti, readout) + **IBM Plex Sans** per il contenuto (titoli di card, indice e
  dettaglio, prosa), via Google Fonts in `app.html`. Il mono ha due registri: minuscolo
  per il testo "battuto" (nav, tagline, eyebrow), maiuscolo con tracking per le
  etichette macchina (`.label`, tasti, rail). Pesi: display 400/500, titoli di
  elemento 500, prosa 300 (dal body). I grigi `gray-*` sono rimappati su neutral nel
  `@theme`: mai `text-white/NN` per il testo. Icone solo Lucide, niente frecce
  Unicode. Lo stato è un LED colorato con etichetta neutra (`StatusBadge`).
- Accento e arrotondamento da token nel `@theme` (`src/lib/styles/globals.css`):
  `--color-accent` (default azzurro `#2cc3f7`) + `--radius-sm/md/lg/xl`. **L'accento
  vive in un punto solo:** glow e ombre lo derivano via `color-mix(var(--color-accent))`,
  non hardcodano l'rgba. La sitemap è un CSS separato (`static/sitemap.css`) col suo
  `--accent`. Un `AccentPicker` (montato in `+layout.svelte`: sotto `lg` un tasto del
  dock in basso a sinistra che cicla i temi, sopra una colonna di LED nel rail
  sinistro) sovrascrive `--color-accent` su `<html>` a runtime (azzurro/arancione/
  viola, persistito in cookie così l'SSR lo applica pre-paint, crossfade CSS): se
  aggiungi un colore-accento NON hardcodarlo.
- Materiali "hardware", in `globals.css` (`@layer components`), tre profondità e un
  solo linguaggio: ciò che si tocca è un **keycap** (`.key`: fondo scuro con filo di
  luce in alto, bordo inferiore nero da 2px che sparisce alla pressione, icona in
  accento; `.key--primary` e `aria-pressed`/`.is-on` pieni d'accento con lo stesso
  spessore; `.key--ghost` testo spento; `.key--sm`; `.key--icon` 44px; `.key--float`
  con ombra; `.key-group` per i segmenti; `.chip` tastino da 11px per tag e filtri,
  `.chip--count` per il conteggio), ciò in cui si scrive è **incassato** (`.field`,
  la pista dello switch), ciò che contiene è una **scocca** (`.panel`: fondo `--shell`
  opaco, bordo `line-2`, stesso bordo inferiore; `.panel--lift` per l'hover della
  card; `.panel__media` schermo incassato con cornice nera interna). Etichette mono
  maiuscole con `.label`, ritmo delle sezioni con `.section`. Token: due raggi
  (`--radius-sm` controlli, `--radius-md` scocche), tre linee (`line-1/2/accent`),
  quattro taglie di mono (`text-tele` rail, `text-label`, `text-xs` date,
  `text-control` tasti). Un valore di bordo, fondo, raggio, ombra o taglia scritto a
  mano in un componente è un errore: usa il token o la classe.
- Controlli: tutto ciò che si clicca è un `.key`. Non ricopiare classi Tailwind di
  bordo/fondo su un bottone, aggiungi solo larghezza o padding se serve. Sotto `lg` i
  tre flottanti (menu, torna su, accento che cicla i temi) sono lo stesso
  `key key--icon key--float` e il footer tiene 6rem di clearance in basso; da `lg`
  il torna-su è un keycap da 26px nel rail destro, l'unico tasto fisico sul telaio.
  Switch animazioni (`MotionToggle`). Le animazioni rispettano il motion toggle; il
  thumb dello switch è esentato apposta (vedi `.motion-thumb` in globals - Tailwind
  v4 anima `translate`, non `transform`).
- Logo testuale `essedev` (`Logo.svelte`), voci nav a indice numerato, menu mobile a
  overlay numerato dentro `max-w-[90vw]`.
- **Telaio strumentale** (`Chassis.svelte`, montato nel `+layout.svelte`): cornice fissa
  che porta stato vivo (sezione corrente, avanzamento scroll, ora di Milano, claim).
  Vive nella gutter del token `--chassis-gutter`, che vale `0px` sotto `lg` e `34px`
  sopra: **qualunque elemento `fixed` va staccato dal bordo con quel token** (vedi
  `AccentPicker`, `BackToTop`), altrimenti finisce sopra un rail. Sotto `lg` il telaio
  non si monta e il claim torna nella status bar della navbar.
- Una sola superficie di navigazione: la barra dei link (`Navbar.svelte`) è `fixed` e
  non `sticky`, perché `overflow-x: hidden` su body e container (serve alla griglia da
  300vw) ne farebbe lo scrollport e non si aggancerebbe mai. Non c'è più una floating
  nav: se serve un controllo persistente, va nel telaio.
- `SectionHeader.svelte`: indice numerato + filo + readout dai dati della sezione. Il
  readout si passa solo se un dato reale lo sostiene, mai un conteggio di cortesia.
- Prosa e pagine di dettaglio: i paragrafi di About e Contatti hanno `max-w-prose`,
  progetto e articolo sono una colonna `max-w-3xl` allineata a sinistra, senza
  immagine hero finché non esistono immagini vere (`src/lib/assets/images` è vuota).
  Il placeholder di `OptimizedImage` è uno schermo spento con griglia, bagliore
  d'accento ed etichetta, non una lastra grigia.
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
