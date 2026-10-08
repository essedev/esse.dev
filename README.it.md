# esse.dev

[English](README.md) · **Italiano**

Portfolio personale di Simone Salerno, online su [esse.dev](https://esse.dev). Fatto con Astro e pubblicato su Cloudflare Workers.

## Stack

- **Astro 7** - pagine statiche, con isole Svelte 5 dove serve interazione
- **Tailwind CSS 4** - stile, più il plugin typography per i contenuti Markdown
- **Content collections** - progetti e articoli come `meta.json` + Markdown per lingua, validati con Zod
- **Cloudflare Workers** - asset statici più un piccolo Worker per rilevare la lingua, i redirect e l'agente del sito
- **Agente del sito** - pi-durable su un Durable Object per visitatore (Cloudflare Agents SDK), modelli tramite OpenRouter
- **TypeScript** (strict), **Vitest** e **Playwright**

## Funzionalità

- Inglese e italiano con route e slug tradotti, redirect al canonico e hreflang
- Il sito come spazio di lavoro: a sinistra una lista (pagine, vetrina dei progetti, metodo, scritti), a destra il riquadro del contenuto con la sua toolbar, navigazione da tastiera
- Home con una breve presentazione, i contatti e da dove iniziare: l'agente, un progetto di punta, il metodo
- Elenchi di progetti e articoli con ricerca e filtri per tag, stato e ordine, tenuti nell'URL
- Tempo di lettura e stima dei token degli articoli, articoli correlati
- Feed RSS per lingua, sitemap con alternate, JSON-LD, `llms.txt`
- Immagini Open Graph generate alla build, una per pagina
- Tema scuro e chiaro: segue il sistema finché il visitatore non ne sceglie uno dal pulsante nella toolbar
- Un agente che risponde dalle pagine del sito e dal codice pubblico dei progetti e mostra chiamate ai tool, token e costo, dietro un triage e un budget giornaliero in costo reale

## Sviluppo

Servono Node 22.12+ e pnpm.

```bash
pnpm install
pnpm dev          # dev server su :4321
pnpm build        # build statica + Worker in dist/
pnpm preview      # build e anteprima con wrangler su :8787
```

L'agente richiede `OPENROUTER_API_KEY`, legge meglio il codice su GitHub con un
`GITHUB_TOKEN` facoltativo, e spedisce le bozze approvate con `TURNSTILE_SECRET` e `MAIL_TO`:
in locale si copia `.dev.vars.example` in `.dev.vars`, in produzione si usa `wrangler secret put`.

Giro di qualità, da lanciare prima di ogni push:

```bash
pnpm lint && pnpm check && pnpm build && pnpm test:ci
```

## Struttura

- `src/pages/` - le route: `[lang]/` per le pagine statiche, più le poche che girano sul Worker
- `src/content/` - progetti, articoli, metodo, adesso e pagine singole, una cartella per voce
  con `meta.json` e un file Markdown per lingua
- `src/agent/` - l'agente del sito: Durable Object, tool, budget e triage
- `src/lib/` - logica pura (contenuti, i18n, SEO, filtri degli elenchi, layout delle OG)
- `src/components/`, `src/layouts/`, `src/scripts/` - UI: componenti Astro e Svelte, la shell
  dello spazio di lavoro e la sua tastiera
- `docs/` - architettura, decisioni, roadmap e il log dei cicli di lavoro

## Documentazione

- [`CLAUDE.md`](CLAUDE.md) - convenzioni, comandi e gotcha (per il coding agent)
- [`docs/CONVENTIONS.md`](docs/CONVENTIONS.md) - lingua, glossario e regole di codice
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) - scelte di design e tradeoff
- [`docs/DECISIONS.md`](docs/DECISIONS.md) - decisioni durature, citabili come `#N` (quelle non più attive in [`docs/decisions-archive.md`](docs/decisions-archive.md))
- [`docs/ROADMAP.md`](docs/ROADMAP.md) - le milestone correnti
- [`docs/CYCLES.md`](docs/CYCLES.md) - log dei cicli di lavoro
- [`docs/features/progetti.md`](docs/features/progetti.md) - come si scelgono e si raccontano i progetti
- [`docs/archive/RESTYLE.md`](docs/archive/RESTYLE.md) - storia del lavoro sull'identità visiva

## Deploy

Cloudflare Workers Builds pubblica a ogni push. Deploy manuale: `pnpm deploy`.

## Licenza

Il codice è rilasciato con [licenza MIT](LICENSE). I contenuti del sito (tutto ciò che sta in
`src/content/`, immagini, favicon e identità visiva) sono tutti i diritti riservati, e il font
di terzi in `src/assets/fonts/` mantiene la sua licenza.
