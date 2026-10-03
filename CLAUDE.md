# CLAUDE.md - simonesalerno.it

Portfolio personale: Astro 7 + TS strict + Tailwind 4, isole Svelte 5, deploy su
Cloudflare Workers. Contenuti file-based (meta JSON + Markdown per lingua), i18n EN/IT
con route e slug tradotti, OG generate a build. Il perché delle scelte sta in
`docs/ARCHITECTURE.md`; stato e log in `docs/ROADMAP.md` e `docs/CYCLES.md` (tienili
aggiornati a fine ciclo).

## Comandi

- `pnpm dev` - dev server Astro su :4321.
- `pnpm build` - build statica + Worker in `dist/`.
- `pnpm preview` - build e `wrangler dev` su :8787 (comportamento di produzione).
- `pnpm check` - astro check (type check di `.astro`, `.ts`, `.svelte`).
- `pnpm lint` - prettier --check + eslint. `pnpm format` per scrivere.
- `pnpm test:unit` - Vitest. `pnpm test:e2e` - Playwright. `pnpm test:ci` - tutti.
- `pnpm deploy` - build + wrangler deploy.

Giro di qualità prima di un commit non banale e SEMPRE prima di un push:
`pnpm lint && pnpm check && pnpm build && pnpm test:ci`. Non c'è CI remota: il deploy
avviene via Cloudflare Workers Builds al push, il gate è locale.

Gli E2E girano contro la build servita da `wrangler dev` su :8787 (vedi
`playwright.config.ts`), non contro il dev server: redirect, header, CSP e 404 esistono
solo lì. Se un server su :8787 è già acceso lo riusano, quindi dopo una modifica
spegnilo o rifai la build, altrimenti testi la build vecchia.

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
- Testi del sito e stringhe della UI in `src/content/site/<lang>.json`, letti da
  `src/lib/site.ts`: si usa `translator(lang)`. Le chiavi sono quelle dell'inglese;
  una chiave mancante in un'altra lingua ferma la build. Config in `src/config/`
  (lingue, route per lingua, vetrina), validata all'import da `src/lib/config.ts`.
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

## Design system

Look neutro di partenza (M14 in `docs/ROADMAP.md`): scala di grigi, Geist e Geist
Mono self-hosted via fontsource. Lo stile vero arriva in M15. Il tentativo
"Laboratorio" (telaio, keycap, mono) resta intero sul branch `restyle/laboratory`;
vision e motivi dello stop in `docs/RESTYLE.md`.

- Token in `@theme` in `src/styles/global.css`: colori `bg`, `surface`, `line`,
  `fg`, `muted`, `subtle` e i quattro colori di stato. Un colore scritto a mano in un
  componente è un errore: si aggiunge un token.
- Classi condivise: `container-page` (larghezza e gutter), `link`, `skip-link`. La
  prosa usa `prose prose-invert` del plugin typography.
- Componenti: `.astro` per tutto ciò che è statico; Svelte solo per le isole
  (`CollectionBrowser`, filtri delle liste). `ProjectCard`, `ArticleRow` e
  `StatusBadge` sono Svelte perché li usa sia la home (render statico) sia l'isola.
- I filtri delle liste vivono nella query string (`?q=`, `?tag=`, `?status=`,
  `?sort=`): logica pura e testata in `src/lib/listing.ts`.
- Icone solo Lucide (`@lucide/astro`, `@lucide/svelte`).

## Convenzioni

- `pnpm` sempre (mai npm/yarn). Tab, 100 colonne, single quote, no trailing comma
  (vedi `.prettierrc`, `.editorconfig`). Il Markdown dei contenuti è escluso da
  prettier.
- Tailwind 4 CSS-first, niente `tailwind.config`.
- Codice e identificatori in inglese, UI in italiano. Accenti italiani corretti, mai
  apostrofo al posto dell'accento. Niente em dash, mai il carattere section sign,
  neanche nei contenuti.
- Commit: Conventional Commits in inglese, atomici. Push solo su comando esplicito.

## Non toccare senza motivo

- CSP in `astro.config.mjs` (`security.csp`) e header in `public/_headers`: se
  aggiungi domini esterni (script, font, connect) aggiorna la CSP o verranno bloccati.
  `frame-ancestors` deve restare nell'header: nel meta tag è ignorato.
- Shiki è spento (`markdown.syntaxHighlight: false`): usa stili inline che la CSP
  blocca. Se serve evidenziare il codice, Prism con un foglio di stile.
