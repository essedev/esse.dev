# CLAUDE.md - simonesalerno.it

Portfolio personale, online su `esse.dev` (dominio principale: `site` in
`astro.config.mjs`; `simonesalerno.it` reindirizza lì con una Redirect Rule di
Cloudflare, non nel codice). Astro 7 + TS strict + Tailwind 4, isole Svelte 5, deploy su
Cloudflare Workers; una pagina è un agente (Durable Object con pi-durable, modelli da
OpenRouter). Il perché delle scelte sta in `docs/ARCHITECTURE.md` e `docs/DECISIONS.md`;
stato e log in `docs/ROADMAP.md` e `docs/CYCLES.md`.

## Comandi

- `pnpm dev` - dev server Astro su :4321.
- `pnpm build` - build statica + Worker in `dist/`.
- `pnpm preview` - build e `wrangler dev` su :8787 (comportamento di produzione).
- `pnpm check` - astro check più `tsc -p tsconfig.worker.json` (il codice del Worker ha i
  tipi del runtime Cloudflare, che si scontrano con quelli del DOM).
- `pnpm lint` - prettier --check + eslint. `pnpm format` per scrivere.
- `pnpm test:unit` - Vitest. `pnpm test:e2e` - Playwright. `pnpm test:ci` - tutti.
- `pnpm eval:jev` - valuta il triage dell'agente su `tests/eval/jev-triage.json`
  (chiamate vere via OpenRouter, dopo una build; fuori da `test:ci`). Da rilanciare se
  cambiano domande, soglie o versione di Jev.
- `pnpm generate-types` - rigenera `worker-configuration.d.ts` dopo ogni modifica a
  `wrangler.jsonc`.
- `pnpm deploy` - build + wrangler deploy.

Giro di qualità prima di un commit non banale e SEMPRE prima di un push:
`pnpm lint && pnpm check && pnpm build && pnpm test:ci`. Non c'è CI remota: il deploy
avviene via Cloudflare Workers Builds al push, il gate è locale.

Gli E2E girano contro la build servita da `wrangler dev` su :8788, non contro il dev
server: redirect, header, CSP, 404 e Durable Object esistono solo lì. Playwright rifà la
build e avvia un server suo ogni volta. Ogni build riscrive `dist/` sotto i piedi di un
`wrangler dev` acceso: l'anteprima su :8787 risponde 404 finché non la riavvii (anche dopo
gli E2E). Un `workerd` orfano su una di queste porte serve asset vecchi: va chiuso.

Segreti in `.dev.vars` (escluso da git, modello in `.dev.vars.example`), letti da
`wrangler dev` e copiati in `dist/server/` dalla build; in produzione
`wrangler secret put`.

## Contenuti

- Una cartella per contenuto in `src/content/{projects,articles,method,now}/`, con
  `meta.json` (campi condivisi) e `<lang>.md` (frontmatter tradotto e corpo). Pagine
  singole (welcome, about, contact) in `src/content/pages/<pagina>/<lang>.md`.
- Schemi in `src/content.config.ts`: un campo nuovo si aggiunge solo lì, i tipi arrivano
  da `CollectionEntry`.
- `src/lib/content.ts` è l'unico accesso ai contenuti. Unisce meta e testo e fa fallire
  la build se manca una lingua, un testo non ha il meta, uno slug si ripete o la vetrina
  punta a un progetto non pubblicato. Un progetto da nascondere va a `published: false`,
  non si cancella.
- Testi del sito e stringhe della UI: collection `site` (`src/content/site/<lang>.json`),
  lette con `getSite(lang)` e `translator(lang)` di `src/lib/site.ts`. Schema rigido: una
  chiave nuova va nello schema e in ogni lingua, e diventa un tipo (`UiKey`).
- Configurazione in `src/config/` (lingue, route per lingua, vetrina), validata
  all'import da `src/lib/config.ts`.
- Standard di Astro dove esistono (collection, `@astrojs/rss`, Fonts API). La sitemap è
  scritta a mano: `@astrojs/sitemap` non sa gli slug tradotti.
- Nel Markdown i comandi vanno in backtick: la tipografia di Astro trasforma `--` in un
  trattino lungo fuori dal codice.

## i18n e routing

- Pagine: `src/pages/[lang]/index.astro`, `[lang]/[section]/index.astro` (sezioni),
  `[lang]/[section]/[slug].astro` (dettagli). `section` è la route localizzata
  (`progetti`, `writing`...); le sezioni logiche sono in `SECTIONS` di `src/lib/i18n.ts`.
- La logica è in funzioni pure in `src/lib/i18n.ts` (`sectionOf`, `routeOf`,
  `translateSlug`, `getLanguageUrl`, `resolveRedirect`): non reimplementarla inline. Le
  route di versioni precedenti (`blog`, `informazioni`) passano da `LEGACY_ROUTES`.
- Sul Worker girano solo `src/pages/index.ts` (lingua da `Accept-Language`),
  `src/pages/[...path].astro` (redirect al canonico o 404) e `/agents/site-agent/*`
  (l'agente, smistato da `src/worker.ts`). Tutto il resto è statico.

## Open Graph e SEO

- OG: endpoint prerenderizzato `src/pages/og/[name].png.ts` (satori + resvg), layout
  puro in `src/lib/og.ts`; il prerender gira in Node per resvg. Gotcha satori: font
  `woff`/`ttf`, mai `woff2`; dimensioni nello `style`.
- Canonical, hreflang e JSON-LD: helper puri in `src/lib/seo.ts`.

## Design system: lo spazio di lavoro

Il sito si usa come un'app (`docs/concepts/concept-a-spazio.html`, scelte in
ARCHITECTURE): lista a sinistra, riquadro del contenuto con la sua toolbar a destra. Shell
in `src/layouts/Workspace.astro`, ordine della lista e del pager in `src/lib/workspace.ts`,
tastiera in `src/scripts/workspace.ts`.

- La lista va in ordine di importanza: pagine singole (benvenuto, chi sono, adesso,
  agente), poi la vetrina dei progetti (`featured.json`, 6) con "tutti i N", metodo,
  scritti, e in fondo i profili esterni. Gli altri progetti li trova la ricerca. Dovrebbe
  stare in 900 px di altezza: oggi ne servono circa 1.000 (aperto in ROADMAP).
- Un parametro nuovo nell'URL si controlla prima contro quelli in uso: `?q=` è la
  ricerca della sidebar, `?ask=` la domanda precompilata dell'agente.
- La navigazione sta nella toolbar (breadcrumb, Esc, "‹ sezione" su mobile), mai un
  "Indietro" nel contenuto. Il livello sopra si calcola dai `crumbs` in `Workspace.astro`.
- Token in `@theme` (`src/styles/global.css`): un valore scritto a mano in un componente
  è un errore. Profondità dal tono delle superfici. Su schermo largo la shell è una
  finestra con due card (lista e contenuto); su mobile tutto a filo.
- Due colori con compiti separati: la lavanda (`accent`) per identità e interazione, il
  verde (`live`) solo per "vivo, riuscito" (LED in corso, copie e invii riusciti), mai
  sul testo corrente.
- Stile del concept B (`docs/concepts/concept-b-stile.html`): lavanda accesa, Departure
  Mono per tutto il mono dell'interfaccia (il codice nella prosa resta Geist Mono), velo
  CRT con i valori in `--crt-*` di `global.css`.
- Nessuna larghezza massima sul contenuto: la misura la danno la colonna e la taglia
  fluida.
- Controlli mai nativi (`ui/Select.svelte`). Icone solo Lucide.
- Una sola ricerca nel sito e un solo cursore lampeggiante. Mai linee o barre d'accento a
  sinistra o sopra un elemento per indicare selezione o stato: la selezione si vede dal
  fondo.
- Niente stili inline negli attributi: la CSP li blocca. Il cambio pagina è istantaneo:
  niente view transition.

## Agente

- Codice in `src/agent/` e `src/components/agent/`; perché e come in ARCHITECTURE
  (Agente), DECISIONS #11-#14.
- Ogni messaggio all'agente in anteprima chiama modelli veri su OpenRouter
  (`OPENROUTER_API_KEY`) e i tool sul codice l'API di GitHub (`GITHUB_TOKEN` facoltativo).
  Gli E2E non mandano messaggi. In locale `draft_message` spedisce nel simulatore di
  wrangler (il testo finisce in `.wrangler/tmp/email/`): per provarlo serve `MAIL_TO`,
  anche finto (`wrangler dev --var MAIL_TO:prova@example.com`).
- Modello, ordine dei provider e timeout in `src/agent/models.ts`; le conversazioni
  esistenti passano al modello nuovo all'avvio dell'oggetto. Limiti di spesa in
  `src/agent/budget.ts`. Triage in `src/agent/triage.ts`, trasporto di Jev in
  `JEV_TRANSPORT` di `src/agent/site-agent.ts`.
- Un tool nuovo è una `ToolRegistration` di pi-durable, con `replay: 'safe'` solo se
  rieseguirlo non ha effetti. I dati del sito si leggono dall'indice `/agent/index.json`
  (generato alla build), mai da fuori.
- Il codice che gira solo sul Worker va escluso da `tsconfig.json` e incluso in
  `tsconfig.worker.json`.
- Sul Worker `fetch` staccato dal suo oggetto (salvato in un campo) lancia "Illegal
  invocation"; in Node e nei test no. Si avvolge: `(input, init) => fetch(input, init)`.
- In Svelte una prop o una variabile non si chiama come una rune (`state`, `derived`,
  `effect`, `props`): `$state(...)` diventa la sottoscrizione a uno store e la pagina si
  rompe a runtime, senza errori da `pnpm check`.

## Convenzioni

- `pnpm` sempre. Tab, 100 colonne, single quote, no trailing comma (`.prettierrc`). Il
  Markdown dei contenuti è escluso da prettier.
- Tailwind 4 CSS-first, niente `tailwind.config`.
- Codice in inglese, UI in italiano con accenti veri. Niente em dash né section sign,
  neanche nei contenuti.
- Commit: Conventional Commits in inglese, atomici. Push solo su comando esplicito.
- Mockup e varianti visive: file HTML in `docs/concepts/`, etichettati A, B, C; quelli
  superati vanno in `docs/archive/concepts/`.

## Non toccare senza motivo

- Header di sicurezza in due posti da tenere allineati: `public/_headers` per gli asset
  statici, `src/middleware.ts` per le risposte del Worker.
- CSP in `astro.config.mjs` (`security.csp`): un dominio esterno nuovo va aggiunto lì.
  `frame-ancestors` deve restare nell'header: nel meta tag è ignorato.
- Shiki è spento (`markdown.syntaxHighlight: false`): usa stili inline che la CSP blocca.
  Se serve evidenziare il codice, Prism con un foglio di stile.
