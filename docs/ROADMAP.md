# Roadmap

Stato corrente del progetto. Milestone reali, non wishlist. Aggiornata insieme al codice.

Ultimo aggiornamento: 2026-09-22

## Contesto

`simonesalerno.it` è un portfolio personale (SvelteKit 2 + Svelte 5 + TS strict +
Tailwind 4) su Cloudflare Workers, con contenuti file-based JSON validati con Zod,
i18n hand-rolled (EN/IT) e immagini OG. È in produzione.

L'overhaul di qualità in 6 fasi (nato da un audit completo: sicurezza,
correttezza, performance, manutenibilità) è completato su tutte le milestone.
Vedi `docs/CYCLES.md` per il log dettagliato del lavoro svolto.

## Milestone

### M1 - Sicurezza & correttezza - ✅ Completata (2026-05-31)

- Redirect i18n in `hooks.server.ts` usano la slug map leggera (niente più load
  all-lingue per richiesta).
- `featuredImagePlaceholder` allineato a `boolean` su type + schema runtime + build;
  rimosso il campo orfano `typewriter`.
- CSP (via SvelteKit) + header di sicurezza (`X-Content-Type-Options`,
  `Referrer-Policy`, `X-Frame-Options`, `Permissions-Policy`).
- Vulnerabilità transitive risolte via pnpm overrides (`cookie`, `rollup`) →
  `pnpm audit` a zero; `compatibility_date` wrangler aggiornata.

### M2 - Test suite - ✅ Completata (2026-05-31)

- Vitest (unit) + Playwright (E2E) configurati da zero.
- Unit test su `ContentLoader` (tutti i metodi), schemi Zod su tutti i contenuti
  reali, slug map, OG html-generator + escape, `getLanguageUrl`, util SEO.
- 10 E2E: redirect i18n, traduzione route, 404, sitemap+hreflang, render dettaglio
  EN/IT, og:image servita.
- `getLanguageUrl` estratto in util puro testabile.

### M3 - OG build-time - ✅ Completata (2026-05-31)

- OG generate a build time (satori + resvg + sharp via vite-node), 57 PNG statici
  in `static/og/`. Rimossi gli endpoint runtime `/api/og` e `/api/og-preview` e la
  dipendenza `workers-og`. Escape HTML su title/excerpt.

### M4 - SEO / i18n / a11y - ✅ Completata (2026-06-01)

- `<link rel="canonical">` + `<link rel="alternate" hreflang>` (en/it + x-default)
  calcolati per pagina da un util puro (`src/lib/utils/seo.ts`).
- JSON-LD: `WebSite` + `Person` in home, `BlogPosting` sugli articoli,
  `CreativeWork` sui progetti. Scelto `Person` invece di `Organization`: il sito è
  un portfolio personale, quindi `Person` è l'entità schema.org corretta.
- `robots.txt` ripulito; skip-to-content link localizzato; `prefers-reduced-motion`
  che azzera animazioni/transizioni.
- Note: `<html lang>` era già corretto (non un gap); il focus trap nei Dropdown
  era già implementato (frecce, Escape, ritorno focus); l'audit `alt` non ha
  trovato immagini senza testo alternativo.

### M5 - Performance / bundle / assets - ✅ Completata (2026-06-01)

- `Promise.all` nei load del layout; sort di progetti/articoli per stringa ISO
  (niente più costruzione di `Date`); `Cache-Control` edge sulle pagine HTML 2xx.
- `OptimizedImage`: dimensione dei gruppi srcset derivata dal conteggio reale
  invece che hardcodata.
- Rimosso `noise-original.png` (576KB, non referenziato).
- Note: la sitemap era già per-lingua con hreflang; `noise.png` non ri-ottimizzato
  (texture ad alta entropia, rischio di regressione visiva per pochi KB); i logo
  PNG risultavano tutti in uso (animazione `Logo` + `FloatingNav`), quindi non
  rimossi (l'item era un'assunzione errata dell'audit).

### M6 - Code quality / DX / docs - ✅ Completata (2026-06-01)

- `ContentLoader`: estratto `loadCollection<T>` generico, eliminata la
  duplicazione projects/articles (i due metodi pubblici sono ora wrapper sottili).
- `.editorconfig` allineato a prettier.
- `CLAUDE.md` di progetto + `docs/ARCHITECTURE.md`; README aggiornato.
- Note: nessun rename di massa per "consistenza naming" (churn non giustificato),
  la consistenza è migliorata dal refactor `loadCollection`. Una CI GitHub Actions
  era stata aggiunta e poi rimossa: con deploy via Cloudflare Workers Builds e gate
  locale prima del push sarebbe stata solo informativa e scollegata dal deploy.

### M7 - Slug map derivata (post-overhaul) - ✅ Completata (2026-06-01)

- La slug map non è più un file pre-generato e committato ma un indice DERIVATO a
  runtime dai contenuti, memoizzato per isolate. Gli slug vivono solo nelle
  traduzioni: eliminata la duplicazione materializzata e quindi ogni possibilità di
  drift. Rimossi script, file e step di build relativi. Dettagli in `docs/CYCLES.md`
  (Ciclo 3).

### M8 - Routing i18n unificato + dead code (post-overhaul) - ✅ Completata (2026-06-01)

- Logica di routing i18n (validazione lingua, route -> chiave logica, traduzione
  route, sezione) estratta in funzioni pure condivise (`src/lib/utils/i18n.ts`),
  unica fonte usata da layout, hooks e `getLanguageUrl`: eliminate le
  reimplementazioni inline sparse.
- Rimosso codice morto dal `ContentLoader` (4 metodi mai usati + `getAvailableLanguages`)
  e il campo `availableLanguages` di `DetailPageData`, che nessun componente leggeva.
  Dettagli in `docs/CYCLES.md` (Ciclo 4).

### M9 - Rifiniture da review live - ✅ Completata (2026-06-01)

- Root `/` sceglie la lingua da `Accept-Language` (fallback en) invece di rimandare
  sempre a `/en`; redirect "smart" portati a un solo hop (niente trailing slash spurio).
- Sitemap: aggiunto `x-default` (coerenza hreflang con l'HTML) e `lastmod` derivato
  dai contenuti invece che dalla data di build.
- OG: noise applicato da sharp dopo il render (2 passaggi, output full-color):
  generazione ~10x più rapida (~8min -> ~1min) e niente banding del gradiente.
- Cache HTML controllata da codice (`Cache-Control` lato worker) dopo aver impostato
  "Respect Existing Headers" su Cloudflare. Dettagli in `docs/CYCLES.md` (Ciclo 5).

### M10 - Nuove funzionalità - ✅ Completata (2026-06-01)

- Badge di stato sulle card progetto, feed RSS per-lingua, tempo di lettura + stima
  token sugli articoli, sezione "articoli simili", tag cliccabili sui dettagli verso
  la listing filtrata. Dettagli in `docs/CYCLES.md` (Ciclo 5).

### M11 - Restyle "Laboratorio" - 🚧 In corso (branch `restyle/laboratory`)

- Rebrand visivo verso un'identità "Laboratorio" (officina/sistema): palette nera +
  azzurro elettrico, Martian Mono + IBM Plex Sans, hero "I cast code.", navbar con
  logo testuale + indice numerato + status bar, card a scheda d'archivio, filtri mono,
  footer "dashboard", menu mobile a overlay. Pagine interne (dettaglio/about/contatti/
  paginazione/404), bottoni uniformati a un solo standard, tema accento centralizzato e
  **accent picker** runtime (azzurro default + arancione/viola, hue-sweep). Vision e
  decisioni in `docs/RESTYLE.md`, log dettagliato in `docs/CYCLES.md` (Ciclo 9).
- **Telaio strumentale:** una cornice fissa (`Chassis.svelte`) attorno al contenuto
  porta stato vivo (sezione, avanzamento, ora, claim) e accoglie i controlli, che da
  oggetti flottanti diventano strumenti del telaio. La navigazione torna una sola
  superficie: via la floating nav duplicata, resta una barra di link allineata alla
  colonna del contenuto. Ogni sezione apre con un header a indice + readout dai dati.
- Su `main`: welcome AI-first + label "Esplorazione" (pushati). Il resto vive sul
  branch (non mergiato).
- Resta: animazioni come sistema coerente; pixel art autoprodotta; riscrittura/
  ricurazione dei contenuti progetti.

## Stato deploy

M1-M10 e il riposizionamento del welcome (parte di M11) sono pushate su `main`; il
deploy avviene via Cloudflare Workers Builds al push. Il grosso del restyle (M11)
è sul branch `restyle/laboratory`, non ancora mergiato: prima del merge serve il
giro `build` + `test:ci` (con alcuni E2E da aggiornare per nav/welcome/badge).
