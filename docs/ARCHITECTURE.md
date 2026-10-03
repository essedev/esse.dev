# Architecture

Il perché delle scelte di questo progetto. Per lo stato corrente vedi
`docs/ROADMAP.md`, per il log dei cicli `docs/CYCLES.md`.

## Cos'è

Portfolio personale in Astro (TS strict, Tailwind 4, isole Svelte 5) su Cloudflare
Workers. Contenuti file-based nel repo, i18n EN/IT con route e slug tradotti,
immagini Open Graph generate a build. Fino al Ciclo 10 era SvelteKit: la riscrittura è
in `docs/CYCLES.md` (Ciclo 11) e la scelta in `docs/DECISIONS.md` #10.

## Rendering: statico, con due eccezioni sul Worker

Tutte le pagine sono prerenderizzate a build e servite da Cloudflare come asset
statici. Il Worker riceve solo ciò che non è un file:

- la root `/` (`src/pages/index.ts`), che sceglie la lingua da `Accept-Language`;
- il catch-all `src/pages/[...path].astro`, che per un URL con lingua, route o slug
  sbagliati fa un solo redirect al canonico (`resolveRedirect` in `src/lib/i18n.ts`)
  e altrimenti risponde 404 con la pagina localizzata.

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

Le pagine della home (welcome, chi sono, contatti) sono Markdown per lingua in
`src/content/pages/`. Titolo del sito, nomi delle sezioni e stringhe della UI stanno
in `src/content/site/<lang>.json` (`src/lib/site.ts`): le chiavi della UI sono
quelle dell'inglese e una chiave mancante in un'altra lingua ferma la build.

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
Gli asset con hash in `/_astro/` sono cacheati come immutabili. Niente endpoint che
riflettono input utente.

## Boundary

Pagine sottili -> `src/lib/content.ts` (dati) -> schemi delle collection
(validazione) -> componenti (UI). La logica pura (i18n, SEO, filtri delle liste,
metriche di lettura, vetrina, correlati, layout OG) è in moduli di `src/lib/` senza
dipendenze da Astro, testabili con vitest in Node. Le isole Svelte ricevono dati già
serializzati (`ListItem` in `src/lib/listing.ts`) e non leggono contenuti.
