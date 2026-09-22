# Architecture

Il perché delle scelte di questo progetto. Per lo stato corrente vedi
`docs/ROADMAP.md`, per il log dei cicli `docs/CYCLES.md`.

## Cos'è

Portfolio personale (SvelteKit 2 + Svelte 5 runes + TS strict + Tailwind 4)
deployato su Cloudflare Workers. Contenuti file-based in JSON, i18n hand-rolled
EN/IT, immagini Open Graph pre-generate.

## Contenuti: JSON file-based, niente DB né CMS

I contenuti (progetti, articoli, pagine, config) vivono come file JSON sotto
`src/lib/content/`, versionati con il codice. Per un portfolio piccolo e a bassa
frequenza di aggiornamento questo elimina ogni infrastruttura (DB, CMS, API) e
rende ogni modifica di contenuto un commit, con review e rollback gratis.

La validazione è doppia e intenzionale:

- a build time `scripts/validate-content.ts` fallisce la build se un JSON viola
  lo schema Zod (`src/lib/schemas/content.ts`);
- a runtime `ContentLoader` rivalida ciò che carica, così un file malformato dà
  un errore parlante invece di propagarsi come `undefined`.

`ContentLoader` cachea in memoria per istanza e carica le traduzioni in modo lazy
(solo la lingua richiesta nelle pagine, tutte le lingue solo dove serve davvero,
es. sitemap). La logica comune progetti/articoli è in un unico `loadCollection<T>`
generico; i due metodi pubblici restano wrapper che forniscono glob, schemi e
chiave di ordinamento.

## i18n: hand-rolled invece di una libreria

Due sole lingue (EN/IT) e il bisogno di controllare interamente la struttura
degli URL (route e slug tradotti: `/en/projects/x` vs `/it/progetti/y`) rendono
una libreria i18n sovradimensionata. Lo schema:

- routing `[page=lang]/[route=route]/[sub]` con param matcher in `src/params/`;
- `hooks.server.ts` fa redirect "smart" (lingua sbagliata, route nella lingua
  sbagliata, slug nella lingua sbagliata) verso l'URL canonico;
- una slug map leggera (indice id -> slug per lingua) DERIVATA a runtime dai
  contenuti e memoizzata per isolate, così i redirect e il language switcher non
  devono caricare tutti i contenuti in tutte le lingue a ogni richiesta. Gli slug
  vivono solo nelle traduzioni: niente file committato, nessun drift possibile;
- la logica di routing (validazione lingua, route -> chiave logica, traduzione
  route, sezione) vive in funzioni pure in `src/lib/utils/i18n.ts`, unica fonte
  usata da layout, hooks e `getLanguageUrl`: niente reimplementazioni inline.
  `getLanguageUrl` e gli helper SEO sono anch'essi puri e testabili.

## Open Graph: pre-generazione a build time

Le OG sono PNG statici generati durante la build (`scripts/generate-og-images.ts`:
satori -> resvg -> sharp) e serviti da `static/og/`. Scelta presa rispetto a un
endpoint runtime perché, per contenuti statici, pre-generare significa zero
compute a runtime, zero superficie di injection e immagini deterministiche.

Punti chiave:

- gira nel passo di build (Node), che su Cloudflare avviene nei Workers Builds:
  satori/resvg/sharp non toccano mai il runtime del Worker;
- le immagini NON sono committate: sono un artefatto di build (gitignored,
  `static/og/`), rigenerato a ogni build come gli altri output;
- il layout risolve un filename deterministico per pagina (`home`,
  `listing-<sezione>-<lang>`, `detail-<sezione>-<id>-<lang>`) con un query param
  di cache-busting legato al timestamp di build.

Le favicon seguono la regola opposta (DECISIONS #7): generate da
`scripts/generate-favicons.ts` a partire da un solo disegno, ma committate e fuori
dalla catena di build, perché cambiano solo col disegno o con l'accento default.

Gotcha noti: satori vuole font `woff`/`ttf` (non `woff2`) e ignora gli attributi
`width`/`height` sulle `<img>` (vanno nello `style`).

## Deploy e caching

Adapter Cloudflare. Le pagine sono deterministiche per path (la lingua è
nell'URL), quindi cacheabili al CDN: `hooks.server.ts` imposta `Cache-Control`
con `s-maxage` + `stale-while-revalidate` sulle risposte 2xx, mantenendo
`max-age=0` perché il browser rivalidi e un nuovo deploy sia visibile subito.
Redirect ed errori non vengono cacheati.

## Sicurezza

CSP gestita da SvelteKit (`svelte.config.js`, `mode: 'auto'` per hash/nonce sugli
script inline propri). Gli header di sicurezza (`X-Content-Type-Options`,
`Referrer-Policy`, `X-Frame-Options`, `Permissions-Policy`) sono applicati in
`hooks.server.ts`. Niente endpoint dinamici che riflettono input utente.

## Boundary

Route sottili -> `ContentLoader` (accesso dati) -> schemi Zod (validazione) ->
sezioni/componenti (UI). La logica pura (routing i18n, language url, SEO, escape)
è estratta in `src/lib/utils/` per poter essere testata senza montare componenti.
Il `ContentLoader` fa solo data-access: la logica di routing non vive lì.
