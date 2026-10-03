# CLAUDE.md - simonesalerno.it

Portfolio personale, online su `esse.dev` (dominio principale: `site` in
`astro.config.mjs`; `simonesalerno.it` reindirizza lì con una Redirect Rule di
Cloudflare, non nel codice). Astro 7 + TS strict + Tailwind 4, isole Svelte 5, deploy su
Cloudflare Workers. Contenuti file-based (meta JSON + Markdown per lingua), i18n EN/IT
con route e slug tradotti, OG generate a build. Il perché delle scelte sta in
`docs/ARCHITECTURE.md`; stato e log in `docs/ROADMAP.md` e `docs/CYCLES.md` (tienili
aggiornati a fine ciclo).

## Comandi

- `pnpm dev` - dev server Astro su :4321.
- `pnpm build` - build statica + Worker in `dist/`.
- `pnpm preview` - build e `wrangler dev` su :8787 (comportamento di produzione).
- `pnpm check` - astro check più `tsc -p tsconfig.worker.json` (il codice del Worker ha i
  tipi del runtime Cloudflare, che si scontrano con quelli del DOM).
- `pnpm generate-types` - rigenera `worker-configuration.d.ts` dopo ogni modifica a
  `wrangler.jsonc`.
- `pnpm lint` - prettier --check + eslint. `pnpm format` per scrivere.
- `pnpm test:unit` - Vitest. `pnpm test:e2e` - Playwright. `pnpm test:ci` - tutti.
- `pnpm deploy` - build + wrangler deploy.

Giro di qualità prima di un commit non banale e SEMPRE prima di un push:
`pnpm lint && pnpm check && pnpm build && pnpm test:ci`. Non c'è CI remota: il deploy
avviene via Cloudflare Workers Builds al push, il gate è locale.

Gli E2E girano contro la build servita da `wrangler dev` su :8788 (vedi
`playwright.config.ts`), non contro il dev server: redirect, header, CSP e 404 esistono
solo lì. Playwright rifà la build e avvia un server suo ogni volta, così non testa mai
una build vecchia. Ogni build riscrive `dist/` sotto i piedi di un `wrangler dev` già
acceso: l'anteprima su :8787 comincia a rispondere 404 e va riavviata dopo la build (anche
dopo gli E2E). Un `workerd` orfano su una di queste porte serve asset vecchi e fa fallire
tutto con dei 404: va chiuso.

## Contenuti

- Progetti e articoli: una cartella per contenuto in `src/content/projects/` e
  `src/content/articles/`, con `meta.json` (campi condivisi: stato, date, link,
  `published`) e `<lang>.md` (frontmatter: slug, titolo, sommario, tag; corpo in
  Markdown). Pagine della home in `src/content/pages/<pagina>/<lang>.md`.
- Schemi in `src/content.config.ts`. Il frontmatter e i meta si validano lì: un campo
  nuovo si aggiunge solo allo schema, i tipi arrivano da `CollectionEntry`.
- `src/lib/content.ts` è l'unico accesso ai contenuti. Unisce meta e testo e fa
  fallire la build se un contenuto pubblicato non ha tutte le lingue, se un testo non
  ha il meta, se uno slug si ripete o se la vetrina punta a un progetto non pubblicato.
- Un progetto che non si vuole mostrare va a `published: false`, non si cancella.
- Testi del sito e stringhe della UI: collection `site` (`src/content/site/<lang>.json`),
  lette con `getSite(lang)` e `translator(lang)` di `src/lib/site.ts` (asincrone). Lo
  schema è rigido: una chiave nuova si aggiunge allo schema in `src/content.config.ts`
  e in ogni lingua, e diventa un tipo (`UiKey`). Config in `src/config/` (lingue, route
  per lingua, vetrina), validata all'import da `src/lib/config.ts`: è configurazione, non
  contenuto.
- Standard di Astro dove esistono: content collections, `@astrojs/rss`, Fonts API
  (`fonts` in `astro.config.mjs`, componente `<Font>` nel layout). La sitemap è scritta a
  mano perché `@astrojs/sitemap` non sa gli slug tradotti e sbaglierebbe gli hreflang.
- Nel Markdown, i comandi vanno in backtick: la tipografia di Astro trasforma `--`
  in un trattino lungo fuori dal codice.

## i18n e routing

- Pagine: `src/pages/[lang]/index.astro`, `[lang]/[section]/index.astro` (listing),
  `[lang]/[section]/[slug].astro` (dettaglio). `section` è la route localizzata
  (`progetti`, `projects`, `blog`); la sezione logica è `projects` | `articles`.
- Tutta la logica è in funzioni pure in `src/lib/i18n.ts`: `sectionOf`, `routeOf`,
  `translateSlug`, `getLanguageUrl` (selettore lingua, hreflang, sitemap) e
  `resolveRedirect` (catch-all). Non reimplementarla inline.
- Girano sul Worker solo `src/pages/index.ts` (lingua da `Accept-Language`) e
  `src/pages/[...path].astro` (redirect al canonico o 404): hanno `prerender = false`.
  Tutto il resto è statico.
- La slug map si deriva dai contenuti (`getSlugMap`): gli slug vivono solo nel
  frontmatter, non c'è niente da rigenerare.

## Open Graph e SEO

- OG: endpoint prerenderizzato `src/pages/og/[name].png.ts` (satori + resvg), layout
  puro in `src/lib/og.ts`. Nomi deterministici: `home`, `listing-<projects|blog>-<lang>`,
  `detail-<projects|blog>-<id>-<lang>`. Il prerender gira in Node per resvg.
- Gotcha satori: font `woff`/`ttf`, mai `woff2`; dimensioni nello `style`.
- Canonical, hreflang e JSON-LD: helper puri in `src/lib/seo.ts`, usati da
  `src/layouts/Layout.astro`.

## Design system: lo spazio di lavoro

Il sito si usa come un'app (concept A, `docs/concepts/concept-a-spazio.html`): due
colonne alte tutta la finestra, ognuna col suo tono. A sinistra la lista (logo, ricerca,
voci, riga di stato coi tasti), a destra il riquadro del contenuto con la sua toolbar
(dove sei, azioni sul documento, lingua). Niente barre a tutta larghezza. Ogni voce resta una
pagina statica col suo URL; la shell è `src/layouts/Workspace.astro`, l'indice della
lista `src/lib/workspace.ts` (unica fonte dell'ordine per lista e pager).

- La lista va in ordine di importanza e deve stare in 900 px senza scrollare: prima le
  pagine singole (chi sono, adesso), poi progetti, metodo, scritti. Dei progetti mostra
  solo la vetrina (`featured.json`, 6) più "tutti i N" verso il registro: gli altri
  restano nella pagina, li trova la ricerca e compare quello aperto.

- Sezioni: progetti, scritti, metodo, adesso, chi sono (`src/config/navigation.json`).
  Metodo e adesso sono collection come i progetti (meta + testo per lingua). Le route
  di versioni precedenti (`blog`, `informazioni`) si reindirizzano con `LEGACY_ROUTES`
  in `src/lib/i18n.ts`.
- Interazione in `src/scripts/workspace.ts`: j/k e frecce, Invio, Esc, h/l (precedente e
  successivo, dal pager), `/` e Cmd/Ctrl+K
  per la ricerca, `[data-copy]` con conferma nella riga di stato, scroll della lista
  ricordato. Il livello sopra (Esc, breadcrumb, `[data-up]`) si calcola in
  `Workspace.astro` dai `crumbs` e torna con la history se si arriva da lì, così il
  registro ritrova i filtri. Mai un "Indietro" dentro il contenuto: la navigazione sta
  nella toolbar, il documento ha solo titolo, meta e testo. Le transizioni fra
  pagine sono quelle native (`@view-transition`), niente router.
- Mobile: la home mostra presentazione e poi la lista; un dettaglio mostra solo il
  contenuto, e la toolbar porta "‹ sezione" (il nome del livello sopra, come in iOS).
- Token in `@theme` (`src/styles/global.css`): superfici `bg`, `panel`, `surface`,
  `hover`; testo `fg`, `text`, `muted`, `subtle` (minimo per il testo, 4,6:1); un
  accento; raggi `--radius-control` e `--radius-panel`. Profondità dal tono delle
  superfici, non dai filetti: l'unica linea separa lista e dettaglio. Classi condivise:
  `.led` (stato), `.kbd`, `.label`, `.chip`, `.ulink`, `.caret`.
- Nessuna larghezza massima sul contenuto: la misura la danno la colonna e la taglia
  fluida (`Prose.astro`, `Page.astro`). Nel dettaglio di un progetto, da `xl`, i fatti
  stanno in una colonna a destra.
- Controlli mai nativi: `ui/Select.svelte` (singola, multipla, con ricerca). Il registro dei progetti usa `EntryRow.svelte`.
- Una sola ricerca nel sito (il campo in cima alla lista: `/` e Cmd/Ctrl+K ci portano,
  filtra anche il registro della pagina) e un solo cursore lampeggiante (accanto a
  `esse.dev`). Mai linee o barre d'accento a sinistra o sopra un elemento per indicare
  selezione o stato: la selezione si vede dal fondo.
- Niente stili inline negli attributi: la CSP li blocca (anche `view-transition-name`
  va in una classe). Icone solo Lucide.

## Convenzioni

- `pnpm` sempre (mai npm/yarn). Tab, 100 colonne, single quote, no trailing comma
  (vedi `.prettierrc`, `.editorconfig`). Il Markdown dei contenuti è escluso da
  prettier.
- Tailwind 4 CSS-first, niente `tailwind.config`.
- Codice e identificatori in inglese, UI in italiano. Accenti italiani corretti, mai
  apostrofo al posto dell'accento. Niente em dash, mai il carattere section sign,
  neanche nei contenuti.
- Commit: Conventional Commits in inglese, atomici. Push solo su comando esplicito.

## Agente

- Codice in `src/agent/` (Durable Object `SiteAgent`, tool, protocollo del socket) e
  `src/components/agent/`. Entry del Worker in `src/worker.ts`. Perché e come in
  `docs/ARCHITECTURE.md` (Agente).
- In `wrangler dev` il binding `AI` è remoto: ogni messaggio all'agente chiama un modello
  vero sull'account Cloudflare. Gli E2E non mandano messaggi.
- Modello in `MODEL_ID` di `src/agent/site-agent.ts`: le conversazioni esistenti passano
  al nuovo all'avvio dell'oggetto. Limiti in `src/agent/budget.ts`, triage in
  `src/agent/triage.ts` (Jev richiede crediti AI Gateway sull'account).
- Un tool nuovo si scrive come `ToolRegistration` di pi-durable con `replay: 'safe'` solo
  se rieseguirlo non ha effetti; i dati del sito si leggono dall'indice
  `/agent/index.json`, mai da fuori.

## Non toccare senza motivo

- Header di sicurezza in due posti da tenere allineati: `public/_headers` per gli asset
  statici, `src/middleware.ts` per le risposte del Worker (root, redirect, 404).
- CSP in `astro.config.mjs` (`security.csp`): se
  aggiungi domini esterni (script, font, connect) aggiorna la CSP o verranno bloccati.
  `frame-ancestors` deve restare nell'header: nel meta tag è ignorato.
- Shiki è spento (`markdown.syntaxHighlight: false`): usa stili inline che la CSP
  blocca. Se serve evidenziare il codice, Prism con un foglio di stile.
