# Cycles

Log cronologico dei cicli di lavoro sul progetto. Ogni ciclo registra obiettivo,
lavoro svolto (con riferimenti ai commit), verifiche e cosa resta. Serve a riprendere
il filo tra una sessione e l'altra. La pianificazione ad alto livello vive in
`docs/ROADMAP.md`.

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
- `pnpm build`: OK end-to-end

---

## Ciclo 7 - Vetrina home: progetti featured (2026-06-02)

### Obiettivo

La home mostrava i 6 progetti piu recenti. Renderla una vetrina curata: scegliere
quali progetti mettere in evidenza, e in che ordine.

### Lavoro

- `3e930ad` feat(home): vetrina di progetti featured. `config/featured.json`
  elenca fino a 6 id progetto in ordine; la home li mette davanti e riempie gli
  slot restanti con i piu recenti non-featured (cap 6 responsivo applicato da
  `ProjectsSection`). Pezzi: schema Zod + tipo `FeaturedConfig`, branch nel
  `loadConfig`, validazione a build (id esistenti, max 6) in `validate-content`,
  util puro `orderFeaturedFirst` (testato), `+page.server` della home che applica
  l'ordinamento. La listing `/[lang]/[route]` non passa di qui.

### Decisioni / note

- Selezione + ordine in un file config (non un flag `featured` nei meta ne un
  `featured_rank`): l'ordine della vetrina e esplicito e in un solo posto,
  disaccoppiato dal contenuto, riordinabile spostando una riga, validabile a
  build. Il boolean non da l'ordine; il rank sparso sui meta e piu fragile.
- Featured solo in home: la listing resta neutra (per data, con filtri/sort), per
  non creare conflitti tra "featured in cima" e l'ordinamento/i filtri scelti
  dall'utente. "Featured" = vetrina della home, non del catalogo.
- `config/featured.json` parte con `["budokan", "core", "horizon"]` come esempio:
  va curato (sono solo un placeholder funzionante).

### Verifiche

- `pnpm check`: 0 errori; `pnpm lint`: pulito
- `pnpm test:ci`: 166 unit verdi (+5 `featured`), 32 E2E verdi (+1 home featured)
- `pnpm build`: OK end-to-end; `validate-content` verde

---

## Ciclo 8 - Link esterno progetto apre in nuova scheda (2026-06-02)

### Obiettivo

Il link al sito del progetto, nella pagina di dettaglio, non apriva in nuova
scheda (mancava `target="_blank"`), a differenza dei link in Contact e Footer.

### Lavoro

- `fix(projects)`: aggiunto `target="_blank"` + `rel="noopener noreferrer"` al
  link esterno in `Project.svelte`, allineandolo agli altri link esterni del sito.

---

## Ciclo 9 - Restyle "Laboratorio" (2026-06-04)

### Obiettivo

Rebrand visivo: da "dev portfolio dark generico" a un'identità "Laboratorio"
coerente. Prima il messaggio (voce e posizionamento), poi il design system. La
vision completa, le idee considerate e quelle scartate vivono in `docs/RESTYLE.md`.

### Su `main` (pushato)

- `feat(content)`: welcome riposizionato AI-first. Via il framing difensivo
  ("l'architettura la decide l'umano, l'AI velocizza, l'umano valida") per uno
  AI-first: l'umano progetta il sistema, l'AI scrive, l'output è production-ready.
- `feat(content)`: label dello status `idea` -> "Esplorazione" / "Exploration"
  (la chiave interna resta `idea`).

### Su branch `restyle/laboratory` (NON mergiato)

- **Palette:** nero piatto + accento **azzurro elettrico** `#2cc3f7` + pavimento in
  prospettiva (griglia) + glow CRT dal basso. Via gradient blu e noise.
- **Tipografia:** **Martian Mono** (titoli, etichette tech) + **IBM Plex Sans**
  (body). Token radius (`--radius-md/lg/xl`) per arrotondamento moderato da un punto.
- **Hero:** "I cast code." (mono, doppio senso cast), allineato a sinistra, firma in
  calce "Simone Salerno · half engineer, half wizard".
- **Navbar:** logo testuale `essedev_` (cursore blink), voci a indice numerato
  (01-04), status bar sotto, toggle lingua `IT / EN` inline (al posto del dropdown).
- **Card + StatusBadge:** scheda d'archivio (header stato + anno, tag mono, hover
  bordo azzurro + lift); badge "riga di sistema" (dot + label mono); applicata anche
  alla ArticleCard (header data).
- **Filtri:** toolbar mono squadrata (SearchFilter + tutti i dropdown).
- **Footer:** brand + tagline + nav numerata + riga di sistema. **FloatingNav**
  squadrata coi numeri. **Back-to-top** squadrato.
- **Shortcut tastiera:** `1-4` -> sezioni, `0`/`Home` -> top, `End` -> fondo
  (reduced-motion aware). I numeri della navbar sono il promemoria degli shortcut.
- **Coerenza:** `//` rimosso dal content delle voci (era decorazione fuori posto);
  numeri solo dove servono.

### Decisioni chiave (scartate, vedi RESTYLE.md)

- Motif "doppia S" (richiama altro -> handle "essedev").
- Font: Jacquard 12/24 (fantasy, non fitta); Fraunces italic (il serif-su-dark
  grande è l'estetica dei template generati da AI).
- Colore: arancione (complementare al logo blu, ci litiga), viola (cliché-AI),
  blu-logo (generico) -> azzurro elettrico.
- Animazioni custom dell'hero **congelate**: tararle alla cieca (senza vedere il
  movimento negli screenshot) non converge; da rifare come sistema coerente.

### Verifiche

- `pnpm lint`: pulito; `pnpm check`: 0 errori (lungo tutti i commit del branch).
- Shortcut testati via browser (`0`->top, `End`->fondo, `2`->sezione about).
- **NON ancora fatto:** `pnpm build` + `pnpm test:ci` completo. Alcuni E2E vanno
  aggiornati (cambiate voci nav, welcome, badge di stato).

### Blocco 1 - pagine restanti (fatto)

- **Pagine dettaglio:** tag progetto/articolo da pill (`rounded-full bg-gray-800`)
  a tag mono squadrati coerenti con le card (border, hover accento); immagine
  featured da `rounded-3xl` (fuori token) a `rounded-xl`. Layout dettaglio progetto
  uniformato all'articolo: header a piena larghezza, immagine full-width sotto,
  contenuto sotto (prima l'immagine era affiancata al 50% e il body schiacciato in
  mezza colonna).
- **Paginazione:** da `rounded-lg` + testo inglese hardcoded ("Prev/Next/Page X of
  Y") a indice numerato mono `01 / 04` (corrente in accento), language-agnostic.
- **404:** numero in mono accento + back link mono con hover accento.
- **Contatti / chip filtri:** underline contatti che cresce in accento (era grigio);
  bottoni X di rimozione filtro `rounded-sm` (erano `rounded-full`) e accento (era
  `blue-400`).

### Blocco 2 - polish: footer, controlli, tema accento (fatto)

- **Footer "dashboard":** RSS/Sitemap/Source come moduli squadrati con icona (mono,
  hover accento), aprono in nuova tab (risorse XML, niente redirect). MotionToggle =
  bottone con switch meccanico squadrato (thumb pieno + glow CRT quando on).
- **Bottoni uniformati:** un solo standard ovunque (`bg-white/[0.02]`, bordo
  `white/10`, `hover:border-accent/50`, `rounded-md`; hover-fill `text-accent` per i
  link, `bg-white/10` per i controlli). Rientrati gli outlier di opacità/superficie.
- **Sitemap:** CSS rifatto sul tema (nero + glow, Martian Mono, loc/label accento,
  card squadrate con hover).
- **Status bar:** claim `Human vision · AI execution` + location; via il dot
  decorativo e il `IT / EN` morto (duplicava il selettore lingua vero sopra).
- **StatusBadge:** dot tondo -> quadratino (coerente col linguaggio squadrato).
- **Tema accento centralizzato:** glow e ombre derivano da `var(--color-accent)` via
  `color-mix`; la sitemap (CSS separato) da un `--accent` locale. L'accento vive in
  un solo punto.
- **Accent picker (feature):** selettore flottante in basso a sinistra, azzurro
  default + arancione/viola. Sovrascrive `--color-accent` a runtime (tutto il sito
  cambia live); il cambio è una "ricalibrazione dell'hue" (sweep HSL, percorso più
  breve, snap esatto) e l'anello di selezione scivola. Persistente in localStorage,
  rispetta il motion toggle. OG/identità restano sull'azzurro default.
- **Fix switch animazioni:** il thumb scivola in accensione E spegnimento (prima
  spegnere applicava `data-motion=reduced` che ne congelava l'animazione; eccezione
  mirata sul thumb, sulla proprietà `translate` - Tailwind v4 non usa `transform`).
- **Menu mobile:** overlay rifatto - X allineata all'hamburger (prima `fixed` altrove,
  "saltava"), voci a indice numerato mono come la navbar, riga di sistema in fondo;
  l'accent picker si nasconde a menu aperto. Via il prop `isFloatingNavVisible`.
- **Selettore lingua:** da `IT / EN` testo con slash (sembrava due link sciolti) a
  segmented control mono bordato, cella attiva in accento - coerente con gli altri
  controlli (navbar, floating nav, overlay mobile).

### Blocco 3 - telaio strumentale e nav unificata (fatto)

- **Telaio (`Chassis.svelte`):** cornice fissa attorno al contenuto che porta stato
  vivo invece di decorazione - sezione corrente con l'indice della navbar (rail
  sinistro), avanzamento scroll come scala (destro), claim (alto), ora di Milano e
  promemoria degli shortcut (basso). È un overlay `fixed`, non uno scroll container:
  scroll nativo, ancore e shortcut continuano a funzionare. `aria-hidden` apposta: è
  telemetria, non contenuto, e la percentuale si aggiorna a ogni scroll.
- **La gutter è un token:** i rail vivono in `--chassis-gutter` (`0px` sotto `lg`,
  `34px` sopra). Sotto `lg` il telaio non si monta e il claim torna nella status bar
  della navbar. Ogni elemento `fixed` va staccato dal bordo con lo stesso token,
  altrimenti finisce sopra un rail.
- **Matte:** uno strato sopra il contenuto ritaglia sfondo (griglia larga 300vw) e
  contenuto scorrevole all'area dello schermo. Il suo raggio è gutter + `--radius-md`,
  perché il raggio interno di un bordo è quello esterno meno lo spessore: senza, il
  contenuto usciva nei quattro angoli. La barra dei link sta a filo del telaio, che le
  dipinge sopra: prima era staccata di 1px e sotto passava una fessura.
- **Controlli promossi a strumenti:** accent picker nel rail sinistro come LED spenti
  con tick in accento sulla cella attiva; lingua come coppia verticale EN/IT sullo
  stesso fianco, con lo stesso tick da indice (l'inattiva resta a piena opacità: il 32%
  regge su un pallino di colore, su una parola da 9.5px compone quasi nero);
  back-to-top da riquadro a chevron sopra `TOP` al piede della scala, con la freccia che
  sale in hover. Niente drag o scrub sulla scala: quella gutter si sovrappone alla
  scrollbar di sistema e uno slider litigherebbe con gli shortcut `0`/`Home`/`End`/`1-4`.
- **Una sola superficie di navigazione:** rimossa la `FloatingNav`, che duplicava
  wordmark, link e selettore lingua della navbar; col telaio era l'unico oggetto a non
  appartenere né alla cornice né allo schermo. Resta una barra da 64px con le quattro
  voci come celle uguali divise da hairline e il wordmark in testa, allineata alla
  colonna del contenuto. È `fixed`, non `sticky`: `overflow-x: hidden` su body e
  container (serve alla griglia da 300vw) rende l'antenato lo scrollport, quindi lo
  sticky non si aggancerebbe mai. Sotto `lg` la navbar scorre via e un burger flottante
  tiene il menu raggiungibile.
- **Header di sezione (`SectionHeader.svelte`):** ogni sezione apre con l'indice
  numerato della navbar, un filo e un readout calcolato dal contenuto stesso (progetti:
  conteggio e range di anni dal `meta.json`), così cornice e contenuto dicono la stessa
  cosa. Il readout compare solo dove un dato reale lo sostiene: gli articoli restano
  nudi sotto i due post (un conteggio da 1 punta un faro sul blog vuoto), about e
  contatti non hanno niente di strutturato da riportare. Conteggio e anni arrivano da
  un'unica fonte: passando solo il totale, il listing mostrava il conteggio reale
  accanto al range della pagina corrente.
- **Righe full-bleed tra le sezioni rimosse:** l'hero chiudeva con `border-b` e la
  sezione seguente apriva con `border-t`, due linee sovrapposte a ogni giunzione. Con
  l'header di sezione erano comunque ridondanti: il confine lo segna già lui, portando
  indice e readout invece di niente.

### Blocco 4 - contenuti, indici tipografici, CRT, favicon (fatto)

- **Ricurazione progetti (`8d57f89`):** 19 progetti pubblicati invece di 25 (4 in
  corso, 5 completati, 6 archiviati, 4 idee); i 15 esclusi sono `published: false`,
  non cancellati, quindi recuperabili. Copy riscritto in prima persona dai README dei
  repo, senza le metriche gonfiate dei vecchi stub. Vetrina home guidata da Relay,
  Nexus e Flux (`config/featured.json`).
- **Due densità nel listing progetti (`2b1949f`):** in corso e completati restano
  card con immagine (vetrina); archiviati e idee diventano un indice tipografico a
  una riga (anno, titolo, excerpt) su due colonne sotto. Split in `utils/shelf.ts`
  (testato). La home mostra solo la vetrina, nell'ordine dei featured. Il listing
  progetti non è più paginato: la paginazione taglierebbe a metà le due densità e la
  collezione è piccola apposta. La label dello status `idea` torna "Idea" (era
  "Esplorazione").
- **Articoli come indice (`976088b`):** l'unico articolo stava da solo in una griglia
  a tre colonne dietro un placeholder. Ora usa lo stesso indice tipografico, con la
  data completa a sinistra; il componente è generalizzato da `ProjectIndex` a
  `EntryIndex`. Gli articoli restano paginati (6 per pagina).
- **Fix indice di sezione in IT (`9017347`):** header e rail del telaio
  confrontavano la chiave logica (`projects`) col nome tradotto (`progetti`) e in
  italiano perdevano l'indice. Ora si risolve per ancora (`#projects`), uguale in
  ogni lingua.
- **Contatti (`b3dd2da`):** email grande, profili su una riga mono con freccia
  uscente; il `mailto` non apre più una tab vuota.
- **Prima dose di CRT (`52b4540`):** tre segni statici, nessuno animato: vignetta
  interna sul telaio (solo da `lg`), glow al fosforo sul testo in accento (derivato
  dal token) e scanline solo sulle miniature dei progetti.
- **Favicon e manifest (`796e15e`):** un solo disegno (schermo scuro con telaio, "e"
  in Martian Mono, cursore a blocco in accento) da cui `scripts/generate-favicons.ts`
  genera tutte le taglie. Gli output sono committati e lo script non sta nella build:
  si rilancia con `pnpm generate-favicons` quando cambiano disegno o accento default.

### Blocco 5 - revisione UI: token, materiali, dock mobile, colonna di lettura (fatto)

Audit con Playwright su 5 pagine per 3 viewport (390, 768, 1440) più metriche dal
DOM. Nessun bug: il problema era la grammatica. Undici raggi, otto opacità di bordo,
cinque fondi di contenitore, otto taglie di mono, quattro stili di chip, tre oggetti
diversi per i tre controlli flottanti di mobile, testo a 1300px su desktop.

- **Token e materiali (`a5f19a2`):** nel `@theme` due raggi, tre linee, tre superfici,
  quattro taglie di mono; in `@layer components` `.panel`, `.chip`, `.field`,
  `.label`, `.section` e le taglie di `.key` (`--sm`, `--icon`, `--float`). Ogni
  componente li consuma, nessun valore a mano. Le classi `.archive-card` e
  `.entry-panel` spariscono dentro `.panel`.
- **Card e indice (`d2550e7`):** miniatura 21:9 sotto `sm`, excerpt a tre righe, una
  riga sola di tre chip che si stringono con l'ellissi più un conteggio: altezza
  stabile in griglia. L'indice sotto `md` non ha più la colonna vuota da 3rem: anno
  inline a destra del titolo, data lunga sopra, excerpt a due righe (riga da ~90px
  invece di 150-175).
- **Dock mobile (`7604f03`):** menu, torna su e accento sono lo stesso tasto
  `key--icon key--float` da 44px; il picker diventa un tasto con il LED acceso che
  cicla i temi, il burger dell'header e quello flottante condividono la cella, il
  footer tiene 6rem di clearance sotto `lg`.
- **Colonna di lettura (`74343bf`):** About e Contatti a `max-w-prose`, progetto e
  articolo in una colonna `max-w-3xl` a sinistra (che ridimensiona anche l'immagine
  hero); excerpt in tondo, meta dell'articolo come etichetta, link del 404 a tasto.
- **Cornice:** i rail passano alla taglia `text-tele` unica e al bordo `line-2` dei
  pannelli, senza cambiare disegno.
- **Desktop, seconda passata:** il "mix" restante era di ruoli, non di misure. Titoli
  di sezione in Martian Mono medium come hero e nav (lo strumento), sans solo per il
  contenuto; grigi rimappati su neutral nel `@theme` (la scala gray di Tailwind è
  bluastra e stonava con accento arancione o viola) e via ogni `text-white/NN`;
  titoli di card e indice allo stesso peso (500); tag come chip anche nell'indice;
  stato come LED colorato con etichetta neutra; frecce Lucide al posto di quelle
  Unicode. Il placeholder delle immagini è uno schermo spento (griglia, bagliore
  d'accento, etichetta) e le pagine di dettaglio non mostrano più l'immagine hero:
  `src/lib/assets/images` è vuota, il blocco torna quando ci saranno immagini vere.
- **Keycap (`docs/concepts/system-variants.html`, scelta B):** dopo due passate il
  tasto illuminato non convinceva ancora: il fondo tinto all'8% stava a metà e leggeva
  come disabilitato. Tre sistemi completi a confronto (Modulo, Keycap, Terminale) con
  card, tasti e TOP insieme; scelto Keycap ed esteso a tutte le superfici: keycap per
  ciò che si tocca (tasti, chip, TOP nel rail), incassato per ciò in cui si scrive
  (campi, pista dello switch), scocca per ciò che contiene (card, indice, filtri,
  dropdown opachi), schermo incassato nella card.
- **Telaio nello stesso materiale:** la gutter diventa la scocca (faccia delle card) e
  lo schermo è incassato con seam nero e ombra verso dentro; lingua e LED dell'accento
  nel rail sono keycap da 26px come il torna-su; la navbar da `lg` è una fascia con la
  faccia della scocca, celle piatte (un menu non è una tastiera).
- **Due mondi:** keycap con ombra a terra dentro uno schermo erano oggetti fisici
  disegnati su un monitor. Modello scelto: dispositivo con schermo. Fuori (telaio, rail,
  navbar) hardware, con `.key--hw` come unico keycap; dentro tutto software, piatto:
  pannelli a bordo sottile, pulsanti a fondo pieno senza spessore, chip e campi piatti,
  hover come luce e non come spostamento. Scartato il "pannello di controllo" (tutto
  fisico): non regge la prosa lunga né mobile, dove il telaio non c'è.
- **Hero e dettaglio:** il titolo dell'hero aveva margini negativi dentro un
  `overflow-hidden` che a Martian Mono tagliavano le ascendenti; tolti entrambi. Le
  pagine di progetto e articolo lasciano la colonna stretta da 48rem per un impianto a
  due colonne da `lg`: scheda tecnica sticky a sinistra, corpo a destra su 68ch.
- Gate a fine giro: lint, check 0 errori, build, 196 unit, 32 e2e.

### Cosa resta

- Cantieri grossi: animazioni come sistema. La pixel art autoprodotta è scartata
  (vedi `RESTYLE.md`); contenuti progetti (Blocco 4) e sistema UI (Blocco 5) fatti.
- Prima del merge/live: `build` + `test:ci` + aggiornare gli E2E + merge su `main`.

## Ciclo 10 - Ripartenza dallo stile base (2026-09-26)

Branch `restyle/base` da `restyle/laboratory`. Il livello di presentazione torna a
quello di `main` (`app.html`, `globals.css`, componenti, sezioni, route, OG, favicon,
`svelte-inview` e `FloatingNav` ripristinati); restano contenuti, schema (`eyebrow`),
loader, `translations.ts` e test unit. Tolti `Chassis`, `EntryIndex`, `SectionHeader`,
`AccentPicker`, `themes.ts`, `reveal.ts`, `shelf.ts` e lo script favicon. Motivo in
`RESTYLE.md` ("Stop e ripartenza"). Gate: lint, check 0 errori, build, 193 unit,
32 e2e. `restyle/laboratory` resta intero per ripescare i pezzi che valgono.

## Ciclo 11 - Riscrittura in Astro con look neutro (2026-10-03)

Branch `astro` da `restyle/base`. Simone ha chiesto di rifare il sito in Astro prima di
lavorare a stile, progetti e tocco AI (`ROADMAP.md`), con un look neutro da usare come
canvas e libertà di non portare tutto 1:1.

- **Contenuti:** script una tantum dai JSON a blocchi a `meta.json` + `<lang>.md` per
  progetti, articoli e pagine; nessun warning di sintassi. Campi delle immagini
  segnaposto tolti, `about` tolto dalla navigazione (non era una pagina), stringhe
  della UI ridotte a quelle usate. L'immagine dell'articolo torna dal backup.
- **Piattaforma:** pagine statiche, Worker solo per root e catch-all (DECISIONS #10).
  La logica dei redirect, prima dentro `hooks.server.ts`, è la funzione pura
  `resolveRedirect`, testata; ora gestisce anche una route senza lingua (`/progetti`).
- **Tolti:** FloatingNav, BackToTop, MotionToggle e animazioni, PixelBlast con
  `three`/`postprocessing`, noise, filtro per intervallo di date, paginazione degli
  articoli (uno solo), sitemap stilizzata, script di validazione e di immagini (lo fa
  la build). Restano nella storia di `main`.
- **Nuovo:** filtri delle liste nella query string, 404 localizzata e `noindex`,
  font self-hosted (niente Google Fonts nella CSP), Umami limitato ai domini di
  produzione, OG neutre generate da un endpoint prerenderizzato.
- **Test:** 55 unit (i18n e redirect, SEO, filtri, metriche dal Markdown, OG, testi)
  e 36 E2E contro `wrangler dev`, compresi filtri, CSP e 404.
- **Card unica e controlli custom (stesso ciclo, su richiesta):** articoli e progetti
  hanno la stessa card. Le select native sono sostituite da `ui/Select.svelte`
  (singola, multipla, con ricerca), con chip dei filtri attivi e filtri multipli in
  OR nella query string. Gli E2E ora girano su :8788 con server sempre nuovo: un
  `workerd` orfano su :8787 serviva una build vecchia e aveva fatto fallire 25 test.

## Ciclo 12 - Struttura: il sito come spazio di lavoro (2026-10-03)

Dopo un ragionamento su testi e struttura (voce e temi da job-seorch e doppia-linkedin,
siti di ingegneri e tendenze attuali), tre mockup di struttura (`struttura.html`) sono
sembrati "il solito portfolio di un developer". Due concept con interazione vera,
fatti da due subagent in parallelo: A spazio di lavoro, B documento. Scelto A.

- **Port in Astro:** shell `Workspace.astro` con lista, dettaglio, barra di stato e
  palette; ogni voce è una pagina statica. Interazione da tastiera in uno script solo,
  transizioni native del browser (compatibili con la CSP).
- **Contenuti:** nuove collection metodo e adesso; i progetti separano `repo` e `site`
  e hanno `install`, `license` e la riga `why` per quelli in vetrina. I numeri di
  release non si salvano più (Relay era già a 54 contro i 51 del mockup): si linka la
  pagina delle release. Articoli da `blog` a `scritti`/`writing`, con redirect delle
  route vecchie. "Chi sono" senza la lista che duplicava il metodo.
- **Test:** 57 unit (route legacy, sezioni senza dettaglio) e 45 E2E (tastiera, filtro,
  palette, Esc, sezioni nelle due lingue).
- **Da fare (detto da Simone):** molti dettagli di spazi, dimensioni e linee.

## Ciclo 13 - Lo spazio di lavoro, rifinito a giri brevi (2026-10-03)

Giri brevi guardando il sito, ogni correzione di Simone trasformata in regola nel
`CLAUDE.md` del progetto.

- **Un controllo per tipo:** una sola ricerca (filtra anche il registro, cerca anche
  nei tag), un solo cursore, nessuna linea d'accento sulla selezione. Palette e campo
  di ricerca del registro rimossi. Lo script di Umami nell'head tratteneva l'evento
  load sulla rete lenta ed era la causa vera degli E2E instabili: ora parte dopo il
  load e solo su esse.dev.
- **Due colonne:** barra in alto e barra di stato davano una T di due toni che non
  corrispondeva a nessuna zona. Ora lista e riquadro sono alti tutta la finestra, il
  riquadro ha una toolbar (percorso, azioni sul documento, lingua) e il "torna su"
  non sta più nel contenuto: breadcrumb, Esc e "‹ sezione" su mobile, con la history
  se si arriva dal genitore (i filtri del registro restano).
- **Pager e lista:** il pager sta in fondo al riquadro anche sulle pagine corte, h/l per
  sfogliare (non `[`/`]`: sulla tastiera italiana del Mac vogliono Option). La lista va
  in ordine di importanza e sta in 900 px: chi sono e adesso, poi la vetrina di 6
  progetti con "tutti i N", metodo, scritti.
- **Piano dell'agente (M17):** una pagina è un agente vero su Cloudflare (Agents SDK,
  pi-agent-core 1.x, isola Svelte), al posto dell'idea del sito ridisegnato dal vivo.
  Scelte in `docs/DECISIONS.md` #11.
- **Test:** 58 unit e 50 E2E.
