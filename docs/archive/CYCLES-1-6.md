# Cycles 1-6 (archivio)

Cicli archiviati da `docs/CYCLES.md`, numerazione intatta.

---

## Ciclo 1 - Overhaul di qualità (2026-05-31)

### Obiettivo

Partito dalla review del lavoro non committato (un refactor "slug map" lasciato in
sospeso), è diventato un audit completo del progetto e un overhaul di qualità in
6 fasi (sicurezza, test, OG, SEO/a11y, performance, code quality/docs).

### Parte A - Recupero contesto e fix iniziali (committata e pushata)

Recuperato il contesto del lavoro in sospeso (refactor slug map per non caricare
tutte le lingue nel layout). Review adversariale del diff: trovato che il refactor
era incompleto e un paio di pezzi pre-esistenti da chiudere. Applicati i fix e
disabilitato l'effetto hero PixelBlast (tenuto per riattivazione futura).

- `0b115e9`..`40a2234` erano già presenti; questo ciclo ha aggiunto e pushato:
- `feat`/`fix` slug map (layout per-lingua + slug-map.json + LanguageSelector)
- `fix`: `findContentBySlug` passa `lang`; generatore slug-map reso deterministico
  (`readdirSync` ordinato); `featuredImagePlaceholder` cablato nei card
- `chore`: disabilitazione PixelBlast hero (commit `74c9ee0`, ultimo pushato)

### Parte B - Audit completo (analisi)

Audit multi-dimensionale (sicurezza app/infra, correttezza, performance,
manutenibilità). Esiti principali, poi affrontati nelle fasi sotto:

- perf: `hooks.server.ts` ricaricava tutte le lingue sui redirect
- correttezza: mismatch type/schema (`featuredImagePlaceholder`, `typewriter`)
- sicurezza: nessun security header/CSP; reflected XSS in `/api/og-preview`; 2 vuln
  transitive (rollup HIGH build-only, cookie LOW)
- manutenibilità: zero test, doc minima
- Decisione chiave: pipeline OG portata a build-time (vedi M3) invece di hardening
  dell'endpoint runtime - per contenuti statici è la scelta migliore (zero compute
  runtime, zero superficie injection). Verificata la fattibilità su Cloudflare:
  la generazione gira nel build (Node), mai sul Worker.
- Falso positivo dell'audit: `<html lang>` risultava mancante ma è già gestito in
  `app.html` + hook.

### Parte C - Fasi 1-3 dell'overhaul (committate; pushate nel Ciclo 2)

10 commit su `main`, da `731c8db` a `bd09838`:

Fase 1 - Sicurezza & correttezza

- `731c8db` perf(i18n): hooks usa la slug map
- `e91a1cd` fix(content): `featuredImagePlaceholder` boolean + rimozione `typewriter`
- `7a5152b` feat(security): CSP + security headers
- `155a434` chore(security): override `cookie`/`rollup`, bump `compatibility_date`
- `9bdc958` chore: smesso di tracciare `image-assets.ts` (già gitignored)

Fase 2 - Test suite

- `1db3caa` test: setup Vitest + unit suite (ContentLoader, schemi, slug-map, OG)
- `e280ef4` refactor(i18n): estratto `getLanguageUrl` in util puro
- `1443a18` test(e2e): suite Playwright routing + unit `getLanguageUrl`

Fase 3 - OG build-time

- `246d6aa` feat(og): pre-generazione OG a build time, rimossi endpoint runtime
- `bd09838` test(og): escape HTML + serving OG statiche

### Verifiche (a fine ciclo)

- `pnpm audit`: 0 vulnerabilità
- `pnpm check` (svelte-check): 0 errori / 0 warning
- `pnpm lint` (prettier + eslint): pulito
- `pnpm build`: OK end-to-end (genera 57 OG e le copia nell'output worker)
- `pnpm test`: 129 unit verdi; Playwright: 10 E2E verdi

### Cosa resta (prossimo ciclo)

- Fasi 4-6 della Roadmap (SEO/i18n/a11y, performance/bundle/assets, code
  quality/DX/docs).
- Push del blocco Fasi 1-3 (10 commit) quando deciso.
- Aggiornamento finale della documentazione.

### Note / debito noto

- Il ramo "detail con cover image" dell'OG generator usa il placeholder finché
  `image-assets.ts` resta vuoto (nessun `og_image_key` risolvibile). Dimensioni img
  spostate nello `style` per compatibilità satori.
- `PixelBlast` e le deps `three`/`postprocessing` sono tenute apposta per una futura
  riattivazione dell'hero, anche se attualmente inutilizzate.

---

## Ciclo 2 - Overhaul di qualità, parte 2 (2026-06-01)

### Obiettivo

Completare le Fasi 4-6 dell'overhaul dopo la pausa di fine Ciclo 1, poi
aggiornamento finale della documentazione.

### Preludio

Pushato il blocco Fasi 1-3 del Ciclo 1 su `main` (fino a `66ff033`).

### Fase 4 - SEO / i18n / a11y

- `82c14a1` feat(seo): canonical, hreflang, JSON-LD + skip-link & reduced-motion

Nuovo util puro `src/lib/utils/seo.ts` (canonical, alternate hreflang en/it +
x-default, builder JSON-LD WebSite/Person/BlogPosting/CreativeWork, serializzazione
con escape di `<`), cablato nel `+layout.svelte`. Aggiunti skip-to-content link
localizzato e `prefers-reduced-motion`. Scoperto che il focus trap dei Dropdown e
`<html lang>` erano già a posto e l'audit `alt` era pulito. Scelto `Person` (non
`Organization`) per il JSON-LD: il sito è un portfolio personale.

### Fase 5 - Performance / bundle / assets

- `114fcd2` perf(content): Promise.all nel layout + sort per stringa ISO
- `0b1cf9c` perf(http): Cache-Control edge sulle pagine HTML 2xx
- `58ce66e` refactor(image): srcset group size derivata dal conteggio reale
- `588e2d8` chore(assets): rimosso `noise-original.png` (576KB, non referenziato)

La sitemap era già per-lingua; `noise.png` non ri-ottimizzato (alta entropia,
rischio visivo per pochi KB); i logo PNG erano tutti in uso (item dell'audit
errato).

### Fase 6 - Code quality / DX / docs

- `c395154` refactor(content): estratto `loadCollection<T>` generico
- `93087d0` chore(dx): `.editorconfig` (+ GitHub Actions CI, poi rimossa)
- `8d80331` docs: `CLAUDE.md` di progetto + `ARCHITECTURE.md`, README aggiornato

Eliminata la duplicazione projects/articles in `ContentLoader`; glob e import
traduzioni restano literal per collezione (richiesto da Vite). Niente rename di
massa per "consistenza naming" (churn non giustificato). La CI GitHub Actions,
aggiunta in `93087d0`, è stata poi rimossa: con deploy via Cloudflare Workers
Builds e gate locale prima del push sarebbe stata solo informativa e scollegata
dal deploy.

### Verifiche (a fine ciclo)

- `pnpm check`: 0 errori / 0 warning
- `pnpm lint`: pulito
- `pnpm build`: OK end-to-end (rigenera le 57 OG)
- `pnpm test:ci`: 143 unit verdi (+14 su `seo`), 15 E2E verdi (+5 su SEO/a11y)

### Cosa resta

- Push delle Fasi 4-6 (commit da `82c14a1` in poi) quando deciso.
- Overhaul concluso: nessuna fase residua. Eventuali nuovi cicli partiranno da
  esigenze nuove.

---

## Ciclo 3 - Slug map derivata, niente drift (2026-06-01)

### Obiettivo

Nato da una domanda di review: la "slug map leggera" introdotta nelle fasi
precedenti era un file pre-generato e committato (`slug-map.json`), copia derivata
degli slug che vivono nelle traduzioni. Duplicazione materializzata = potenziale
drift (in produzione la build rigenerava, ma il file committato e la dev potevano
restare stale, senza alcun guardrail).

### Decisione

Valutate tre opzioni: (1) indice derivato a runtime, (2) tenere il file ma
gitignorarlo + guardrail, (3) spostare gli slug nei `meta.json`. Scelta la **1**:
elimina la causa (la copia materializzata) invece di sincronizzarla con una toppa,
rimuove codice invece di aggiungerne, e a questa scala non costa nulla. La 3 non
aggiunge correttezza sulla 1 (entrambe single source), ottimizza solo la scala a
costo di coesione: rinviata a quando i contenuti cresceranno (vedi `ARCHITECTURE.md`).

### Lavoro svolto

- `ContentLoader.loadSlugMap` ora DERIVA l'indice id -> { lang: slug } dai contenuti
  (`loadProjects`/`loadArticles` su tutte le lingue) invece di importare un JSON.
- Memoizzazione a livello di modulo: l'indice è globale e i contenuti immutabili
  per la vita dell'isolate, quindi si calcola una volta sola. Senza questo, il
  ricalcolo per richiesta rallentava la dev e rendeva flaky un E2E.
- Rimossi `scripts/generate-slug-map.ts`, `src/lib/content/slug-map.json` e lo step
  `generate-slug-map` dalla build chain.
- Test: rimosso `slug-map.test.ts` (testava il generatore), aggiunto in
  `content-loader.test.ts` un invariante che verifica indice == slug delle
  traduzioni per ogni lingua.

### Verifiche

- `pnpm check`: 0 errori; `pnpm lint`: pulito
- `pnpm test:ci`: 139 unit verdi, 15 E2E verdi (suite tornata a ~10s)
- `pnpm build`: OK end-to-end

---

## Ciclo 4 - Routing i18n unificato + dead code rimosso (2026-06-01)

### Obiettivo

Sempre da review: la logica di routing/i18n (validazione lingua, route -> chiave
logica, route valida, traduzione route, sezione) era reimplementata in 4 posti
(metodi del `ContentLoader`, funzioni inline nel `+layout.svelte`, logica inline
negli `hooks.server.ts`, e dentro `getLanguageUrl`). Inoltre alcuni metodi del
loader e un campo di output erano codice morto.

### Decisione

Unica fonte per le regole di routing: un modulo di funzioni pure
`src/lib/utils/i18n.ts` (prende navigation/languages come argomenti, niente I/O),
usato sia lato server sia lato client. La logica NON va nel `ContentLoader` (che
resta data-access). Il codice morto si rimuove.

### Lavoro svolto

- Nuovo `src/lib/utils/i18n.ts`: `isValidLanguage`, `routeKeyOf`,
  `isValidRouteForLang`, `findRouteKeyAnyLang`, `translateRoute`, `sectionOf`.
- `getLanguageUrl`, `+layout.svelte` (rimosse 3 funzioni inline + `ogSection`) e
  `hooks.server.ts` ora usano le primitive condivise.
- Rimossi dal `ContentLoader` 5 metodi: 4 mai usati (`isValidRoute`,
  `isValidLanguage`, `getRouteType`, `contentExists`) e `getAvailableLanguages`,
  il cui output (`availableLanguages` in `DetailPageData`) non era letto da nessun
  componente. Rimosso anche il campo e le due chiamate nel `+page.server.ts`.
- Test: nuovo `i18n.test.ts` per le primitive; potati da `content-loader.test.ts`
  i test dei metodi rimossi.

### Verifiche

- `pnpm check`: 0 errori; `pnpm lint`: pulito
- `pnpm test:ci`: 145 unit verdi, 15 E2E verdi
- `pnpm build`: OK end-to-end

---

## Ciclo 5 - Hardening da review live + nuove funzionalità (2026-06-01)

### Obiettivo

Dopo il deploy: verifica in produzione, rifiniture emerse dalla review live e
aggiunta di funzionalità mancanti.

### Manutenzione doc

- Doc di progetto rinominati in CAPS (`CYCLES.md`, `ROADMAP.md`), riferimenti aggiornati.
- Note personali (export chat, profilo LinkedIn, backup immagini) spostate in
  `docs/archive/`. Le featured image dei progetti sono placeholder-only per scelta
  (originali parziali in `docs/archive/backup/`).

### Rifiniture (M9)

- `00d1c6e` feat(i18n): root Accept-Language (fallback en) + redirect a un solo hop
- `883e8f3` fix(sitemap): x-default + lastmod derivato dai contenuti
- `5172f0e` perf(og): noise via sharp (2 passaggi, full-color), ~10x più veloce,
  niente banding
- Cloudflare: "Browser Cache TTL -> Respect Existing Headers" (impostazione dashboard)
  per onorare il `Cache-Control` emesso dal worker.

### Nuove funzionalità (M10)

- `8771c3d` feat(projects): badge di stato sulle card
- `247af32` feat(blog): feed RSS per-lingua (`/[lang]/rss.xml`) + discovery nel head
- `81bacda` feat(blog): tempo di lettura + stima token (~1.3/parola, etichetta "~")
- `744b4f5` feat(blog): sezione articoli simili (per tag in comune)
- `6c2fea4` feat(content): tag cliccabili sui dettagli verso la listing filtrata

### Decisioni / note

- Stima token approssimata (niente tokenizer reale) per non gonfiare il bundle del
  Worker; etichettata "~".
- Tag cliccabili fatti sui dettagli (hanno sia il tag grezzo sia il tradotto); sulle
  card servirebbe un refactor dei prop, rimandato.
- Share articolo: valutato, versione minimale (Web Share API + copia link) non ancora
  implementata, in attesa di conferma.

### Verifiche

- `pnpm check`: 0 errori; `pnpm lint`: pulito
- `pnpm test:ci`: 156 unit verdi, 17 E2E verdi
- `pnpm build`: OK end-to-end; produzione verificata via HTTP (redirect, OG, sitemap,
  RSS, header)

---

## Ciclo 6 - Metriche articolo, restyle sitemap, back contestuale (2026-06-01)

### Obiettivo

Rifiniture post-deploy: stima token più realistica, vista sitemap allineata
all'identità del sito, e un bug di navigazione segnalato live (il "Indietro" delle
pagine di dettaglio tornava sempre in home).

### Lavoro

- `11c261f` feat(content): stima token da caratteri/divisore per lingua (~4 EN,
  ~3.5 IT) invece di parole\*1.3. Cattura la lunghezza media delle parole, più
  realistica sull'italiano (BPE frammenta di più). I code block sono ora esclusi
  dalla prosa (e dai minuti di lettura) e contati solo nei token; `extractText`
  esplicito sui tipi di prosa, aggiunto `extractCode`, `contentMetrics` prende la
  lingua (passata da `Article.svelte` via `currentLang`).
- `6557978` feat(sitemap): restyle del foglio di stile della sitemap nel browser
  (gradiente indaco su nero, font Geist, palette monocromatica fredda). I crawler
  ignorano il CSS e leggono l'XML grezzo.
- `ae97f6a` docs: correzione accenti italiani nei commenti (`OptimizedImage`,
  `seo.ts`, `rss.xml`).
- `47637a3` fix(nav): back contestuale nelle pagine di dettaglio. Il bottone era un
  link cablato alla home: da listing -> dettaglio -> Indietro si finiva in home.
  Nuovo componente condiviso `BackLink` che ripercorre la history se si arriva da
  una pagina interna, altrimenti ripiega sull'URL della listing.
- `21e8fea` test(e2e): copertura dei casi di redirect i18n finora scoperti (lingua
  non valida, route in lingua sbagliata con slug, no-loop sul canonico, traduzione
  slug cross-lingua sugli articoli) + 5 E2E sul back contestuale.
- `1800f08` feat(projects): badge di stato anche nel dettaglio (prima solo sulle
  card: il dato `meta.status` c'era ma non veniva reso). Estratto `StatusBadge`
  condiviso (stile + etichetta da una sola fonte), elimina la duplicazione che era
  sparsa tra `ProjectCard` (`STATUS_STYLE`) e `Projects` (`STATUS_KEY`).

### Decisioni / note

- La stima resta approssimata e senza tokenizer reale (etichetta "~"), come nel
  Ciclo 5: l'euristica passa da per-parola a per-carattere/lingua, più stabile.
  Un tokenizer reale resterebbe esatto solo per un modello specifico (per Claude
  non esiste tokenizer offline pubblico) e andrebbe spostato a build time per non
  pesare sul bundle del Worker: non giustificato per un'etichetta decorativa.
- Back contestuale via `history.back()` (non un target fisso): rispetta da dove si
  arriva. Resta un vero `<a href>` verso la listing come fallback per atterraggi
  diretti e accessibilità.
- Check redirect: tutti gli slug dei progetti coincidono tra en/it, quindi la
  traduzione slug del hook (PRIORITÀ 1.5) non scatta mai sui progetti; l'unico
  contenuto che la esercita è l'articolo. Coperto nei test.
- Warning dev-only di SvelteKit ("Avoid using history.pushState") emerso nei nuovi
  E2E interattivi: non proviene dal fix (`BackLink` usa `history.back`), nessun
  `pushState` diretto nel codice. Da indagare a parte se diventa fastidioso.

### Verifiche

- `pnpm check`: 0 errori; `pnpm lint`: pulito
- `pnpm test:ci`: 161 unit verdi, 31 E2E verdi (+14: 5 back, 8 redirect, 1 badge)
