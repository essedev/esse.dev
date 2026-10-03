# Architecture

Il perché delle scelte di questo progetto. Per lo stato corrente vedi
`docs/ROADMAP.md`, per il log dei cicli `docs/CYCLES.md`.

## Cos'è

Portfolio personale su `esse.dev`, in Astro (TS strict, Tailwind 4, isole Svelte 5) su Cloudflare
Workers. Contenuti file-based nel repo, i18n EN/IT con route e slug tradotti,
immagini Open Graph generate a build. Fino al Ciclo 10 era SvelteKit: la riscrittura è
in `docs/CYCLES.md` (Ciclo 11) e la scelta in `docs/DECISIONS.md` #10.

## Rendering: statico, con tre eccezioni sul Worker

Tutte le pagine sono prerenderizzate a build e servite da Cloudflare come asset
statici. Il Worker riceve solo ciò che non è un file:

- la root `/` (`src/pages/index.ts`), che sceglie la lingua da `Accept-Language`;
- il catch-all `src/pages/[...path].astro`, che per un URL con lingua, route o slug
  sbagliati fa un solo redirect al canonico (`resolveRedirect` in `src/lib/i18n.ts`)
  e altrimenti risponde 404 con la pagina localizzata;
- `/agents/site-agent/*`, il WebSocket dell'agente (sotto).

L'entry del Worker è `src/worker.ts`: manda solo `/agents/site-agent/*` a
`routeAgentRequest` e tutto il resto all'handler di Astro, ed esporta i due Durable Object
(`SiteAgent` e `Ledger`). Il filtro sul path serve perché `routeAgentRequest` instraderebbe
qualunque classe esportata, e `Ledger` deve restare raggiungibile solo via RPC.

Il prerender gira in Node (`prerenderEnvironment: 'node'`) perché le OG usano resvg,
che è nativo. Gli E2E girano contro la build servita da `wrangler dev`, non contro il
dev server, così redirect, header e 404 sono quelli di produzione.

## Contenuti: file nel repo, niente DB né CMS

Ogni progetto e articolo è una cartella in `src/content/`: `meta.json` con i campi
condivisi tra le lingue (stato, date, link, pubblicato) e un `<lang>.md` per lingua
(frontmatter con slug, titolo, sommario, tag; corpo in Markdown). Le due metà sono
content collection separate (`src/content.config.ts`, schemi Zod) e si uniscono in
`src/lib/content.ts`, unico accesso ai contenuti per pagine ed endpoint. Lì si fanno
rispettare a build le regole che lo schema non vede: un contenuto pubblicato ha il
testo in ogni lingua, ogni testo ha il suo meta, gli slug sono unici per lingua, la
vetrina (`src/config/featured.json`) punta a progetti pubblicati. Una violazione fa
fallire la build.

Perché due file per contenuto: `meta.json` tiene i fatti, `<lang>.md` la prosa. I
fatti sono condivisi tra le lingue (copiarli in ogni Markdown li farebbe divergere) e
sono quelli che uno script può aggiornare dalle fonti (repo, date, stato) senza toccare
un testo scritto a mano. Lo standard di Astro sarebbe un Markdown per lingua con tutto
il frontmatter: si paga in duplicazione, e cresce con i campi delle cover in arrivo.

Le pagine della home (welcome, chi sono, contatti) sono Markdown per lingua in
`src/content/pages/`. Titolo del sito, nomi delle sezioni e stringhe della UI sono la
collection `site`, con schema rigido: ogni lingua ha tutte le chiavi e nessuna in più,
e le chiavi sono un tipo. Config (lingue, route, vetrina) resta JSON importato e
validato da `src/lib/config.ts`, perché è configurazione e non contenuto.

Dove Astro ha uno standard si usa quello: content collections, `@astrojs/rss`, Fonts
API per i font self-hosted con preload e fallback tarati. La sitemap no:
`@astrojs/sitemap` ricava le alternate sostituendo il prefisso di lingua e con gli slug
tradotti sbaglierebbe gli hreflang.

## i18n: route e slug tradotti, logica pura

Due lingue e il controllo completo degli URL (`/en/projects/x` contro
`/it/progetti/y`) rendono una libreria sovradimensionata, e l'i18n di Astro non
traduce i segmenti né gli slug. Le route per lingua sono in `src/config/navigation.json`;
la slug map (id -> lingua -> slug) è derivata dai contenuti. Tutta la logica (sezione
di una route, traduzione di route e slug, URL equivalente in un'altra lingua,
redirect al canonico, lingua preferita) è in funzioni pure in `src/lib/i18n.ts`,
testate a unità e usate da pagine, header, SEO, sitemap e catch-all.

## Open Graph: generate a build

Un endpoint prerenderizzato (`src/pages/og/[name].png.ts`) produce un PNG per pagina
con satori e resvg: `home`, `listing-<sezione>-<lingua>`,
`detail-<sezione>-<id>-<lingua>`. Il layout è un albero puro in `src/lib/og.ts`. Zero
compute a runtime, niente superficie di injection, immagini deterministiche. Gotcha
di satori: font `woff`/`ttf`, mai `woff2` (si leggono da `@fontsource/geist-sans`).

## Sicurezza e header

CSP generata da Astro (`security.csp`) come meta tag nelle pagine, con gli hash degli
script inline; Umami è l'unico dominio esterno ammesso. `frame-ancestors` nel meta
tag è ignorato, quindi va come header in `public/_headers` insieme a
`X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options` e `Permissions-Policy`.
Le risposte del Worker (root, redirect, 404) non passano da `_headers`: gli stessi
header li aggiunge `src/middleware.ts`. Gli asset con hash in `/_astro/` sono cacheati
come immutabili. Niente endpoint che
riflettono input utente.

## Interfaccia: il sito come spazio di lavoro

Il sito si usa come un'app (concept A, `docs/concepts/concept-a-spazio.html`, Ciclo 12):
due colonne alte tutta la finestra, ognuna col suo tono. A sinistra la lista (logo,
ricerca, voci, riga di stato con legenda e tasti), a destra il riquadro del contenuto con
una toolbar (percorso, azioni sul documento, lingua). Nessuna barra a tutta larghezza:
con due toni su righe orizzontali la pagina formava una T che non corrispondeva a nessuna
zona (Ciclo 13). Ogni voce resta una pagina statica col suo URL; le transizioni sono
quelle native del browser (`@view-transition`), senza router.

- **Lista** (`src/lib/workspace.ts`): in ordine di importanza e alta al massimo 900 px.
  Prima le pagine singole (chi sono, adesso, agente), poi la vetrina dei progetti con
  "tutti i N" verso il registro, metodo, scritti. I progetti fuori vetrina restano nella
  pagina: la ricerca li trova e compare quello aperto. È anche la fonte dell'ordine del
  pager.
- **Navigazione** (`src/scripts/workspace.ts`): j/k e frecce nella lista, Invio, Esc al
  livello sopra, h/l (o le frecce laterali) per precedente e successivo, `/` e Cmd/Ctrl+K
  per la ricerca. Non `[`/`]`: sulla tastiera italiana del Mac richiedono Option. Il
  livello sopra (Esc, breadcrumb, "‹ sezione" su mobile) si calcola dai `crumbs` e torna
  con la history se si arriva da lì, così il registro ritrova i filtri. Il documento ha
  solo titolo, meta e testo: niente "Indietro" nel contenuto.
- **Mobile**: la home mostra la presentazione e poi la lista; un dettaglio mostra solo il
  contenuto, con "‹ sezione" nella toolbar come in iOS.
- **Token** (`@theme` in `src/styles/global.css`): superfici `bg`, `panel`, `surface`,
  `hover`; testo `fg`, `text`, `muted`, `subtle` (il minimo per il testo, 4,6:1); un
  accento; `danger`; raggi `--radius-control` e `--radius-panel`. Classi condivise:
  `.led`, `.kbd`, `.label`, `.chip`, `.ulink`, `.caret`.
- **Misura**: nessuna larghezza massima sul contenuto, la danno la colonna e la taglia
  fluida (`Page.astro`, `Prose.astro`). Nei dettagli, da `xl`, i fatti stanno in una
  colonna a destra; la pagina riempie almeno il riquadro e il pager sta in fondo.

## Agente

`/it/agente` è una pagina statica con un'isola Svelte (`AgentChat.svelte`) che apre un
WebSocket verso un Durable Object per visitatore (`SiteAgent`, `src/agent/`). Dentro gira
pi-durable tramite `PiHarness` dell'Agents SDK: conversazione nel SQLite dell'oggetto,
ripresa dopo una sospensione, tool come estensioni di pi. Il protocollo del socket e il
riduttore degli eventi (`sockets.ts`, `view.ts`) vengono dall'esempio ufficiale e sono gli
stessi sui due lati.

- **Modelli:** da OpenRouter (`src/agent/models.ts`), `glm-5.3-flash` su una lista
  ordinata di provider veloci con passaggio automatico al successivo, timeout sullo stream
  senza token e nuovi tentativi di pi. Chiave `OPENROUTER_API_KEY` come secret del Worker. Il
  binding `AI` resta solo come trasporto alternativo di Jev. Scelte in
  `docs/DECISIONS.md` #11.
- **Tool sul sito:** `search_site`, `read_page`, `list_projects` e `show_page` leggono
  `/agent/index.json`, un indice del sito generato alla build dalle stesse collection
  delle pagine e letto dagli asset: l'agente vede solo ciò che il sito pubblica.
  `show_page` diventa una scheda nella trascrizione, che il visitatore apre quando vuole.
- **Tool sul codice:** `repo_overview`, `list_files`, `read_file`, `search_code` e
  `recent_commits` leggono i repo pubblici dall'API REST di GitHub (`github.ts`). Il repo
  è un parametro a valori chiusi: i `repo` dei progetti pubblicati più quello del sito.
  `read_file` numera le righe, dà il link a GitHub e legge i file lunghi a pezzi. Con
  `GITHUB_TOKEN` (facoltativo) il limite sale a 5.000 richieste l'ora e `search_code`
  cerca nel codice; senza, cerca solo nei nomi dei file. Scelte in #13.
- **Capacità:** `render` disegna barre, tabelle e linee del tempo. Il modello manda dati,
  mai HTML; la stessa validazione (`render.ts`) gira nel Durable Object, che rimanda
  l'errore al modello, e nel browser, che disegna coi token del sito (le barre sono SVG:
  la CSP blocca gli stili inline).
- **`run_code`:** il Code Mode di Cloudflare (`@cloudflare/codemode`, `run-code.ts`). Il
  modello scrive una funzione JavaScript che chiama i tool di sola lettura come
  `codemode.nome()`, con le dichiarazioni TypeScript generate dagli schemi nella
  descrizione del tool. Gira in un Dynamic Worker (binding `LOADER`, piano a pagamento)
  senza rete né ambiente, con tetti su tempo, chiamate e dimensione del risultato; ogni
  chiamata passa dalla stessa validazione e dallo stesso `execute` dei tool normali.
- **`delegate`:** 2 o 3 sotto-agenti in parallelo, con lo schema dei sotto-agenti di
  pi-durable: ogni figlio è una conversazione posseduta dalla chiamata (fermare il padre
  ferma i figli, una ripresa li ritrova), con i soli tool di sola lettura e istruzioni da
  sotto-agente. Il loro costo non è nella conversazione principale: lo scala il tool, una
  volta sola (`memo`). La pagina mostra per ogni figlio chiamate, token, costo e risposta
  (`delegate.ts`, `DelegateView.svelte`); gli eventi dei figli non arrivano dal vivo.
- **Il catalogo** che la pagina mostra a conversazione vuota è quello che il server
  annuncia nel `hello`: un tool nuovo compare da solo, i gruppi in pagina lo ordinano.
- **Triage e limiti:** ogni messaggio passa prima da Jev (`triage.ts`), che ferma fuori
  tema e abuso e decide la lingua della risposta; la spesa si scala in costo reale per
  visitatore (nel `SiteAgent`) e per tutto il sito (Durable Object `Ledger`), con le soglie
  in `budget.ts`. Se Jev non risponde il messaggio passa e vale il tetto. Le soglie si
  verificano con `pnpm eval:jev` su un set etichettato (`tests/eval/jev-triage.json`).
  Scelte in `docs/DECISIONS.md` #12.
- **Trascrizione:** Markdown passato da un renderer che sanifica (`markdown.ts`),
  ragionamento chiuso, verdetto di Jev, token, costo e budget residuo per ogni risposta.

Il codice del Worker ha un suo `tsconfig.worker.json`: i tipi del runtime Cloudflare
(`worker-configuration.d.ts`, generati da `wrangler types`) si scontrano con quelli del DOM.

## Boundary

Pagine sottili -> `src/lib/content.ts` (dati) -> schemi delle collection
(validazione) -> componenti (UI). La logica pura (i18n, SEO, filtri delle liste,
metriche di lettura, vetrina, correlati, layout OG) è in moduli di `src/lib/` senza
dipendenze da Astro, testabili con vitest in Node. Lo stesso per l'agente: la logica pura
(budget, triage, indice del sito, trascrizione) sta in moduli di `src/agent/` separati dal
Durable Object. Le isole Svelte ricevono dati già
serializzati (`ListItem` in `src/lib/listing.ts`) e non leggono contenuti.
