# Decisions

Decisioni che vincolano il futuro e avevano un'alternativa reale scartata. Voci
numerate e citabili come `#N`; status: `proposta`, `attiva`, `superata da #M`,
`assorbita in <doc>`. Il "cosa è stato fatto" sta in `docs/CYCLES.md`.

Le scelte strutturali di fondo (contenuti JSON senza DB, i18n hand-rolled, slug map
derivata, OG a build time) sono spiegate in `docs/ARCHITECTURE.md`; quelle di identità
visiva (palette, font, hero, pixel art scartata) in `docs/RESTYLE.md`.

## #1 - Niente CI remota, gate di qualità locale

**Status:** attiva (Ciclo 2, M6)

Il deploy parte da Cloudflare Workers Builds al push. Una GitHub Actions era stata
aggiunta e poi rimossa: sarebbe stata solo informativa e scollegata dal deploy. Il gate
è `pnpm lint && pnpm check && pnpm build && pnpm test:ci` in locale, sempre prima di
un push. Scartata: CI GitHub come gate (non blocca il deploy, doppia fonte di verità).

## #2 - Stima token euristica, senza tokenizer reale

**Status:** attiva (Cicli 5-6)

Token stimati da caratteri/divisore per lingua (~4 EN, ~3.5 IT), etichettati "~",
code block contati solo nei token. Scartato un tokenizer reale: esatto per un solo
modello (per Claude non ne esiste uno offline pubblico) e peso sul bundle del Worker
o spostamento a build time, sproporzionati per un'etichetta decorativa.

## #3 - Vetrina home da un file config, non da flag nei meta

**Status:** attiva (Ciclo 7)

Selezione e ordine dei progetti in home stanno in `config/featured.json`, validato a
build (id esistenti, max 6). Scartati il boolean `featured` nei `meta.json` (non dà
l'ordine) e un `featured_rank` sparso (fragile). Featured vale solo per la home: il
listing resta neutro, ordinato per data e filtrabile.

## #4 - Una sola superficie di navigazione, barra `fixed`

**Status:** attiva (Ciclo 9, blocco 3)

Rimossa la floating nav, che duplicava la navbar; i controlli persistenti vanno nel
telaio (`Chassis.svelte`). La barra è `fixed` e non `sticky`: `overflow-x: hidden` su
body e container (necessario alla griglia da 300vw) rende l'antenato lo scrollport e
lo sticky non si aggancerebbe mai. Scartate: floating nav + navbar, sticky.

## #5 - Listing progetti a due densità, senza paginazione

**Status:** attiva (Ciclo 9, blocco 4)

In corso e completati come card con immagine (vetrina), archiviati e idee come indice
tipografico a una riga (`utils/shelf.ts`, `EntryIndex`). Il listing progetti non è
paginato: la paginazione taglierebbe a metà le due densità e la collezione resta
piccola per scelta curatoriale. Gli articoli restano paginati. Scartata: griglia unica
di card paginata.

## #6 - Progetti esclusi si depubblicano, non si cancellano

**Status:** attiva (Ciclo 9, blocco 4)

Un progetto che esce dal portfolio passa a `published: false` in `meta.json` e resta
nel repo, recuperabile senza scavare nella storia git. Scartata: cancellare la
cartella del progetto.

## #7 - Favicon generate da script, output committati fuori dalla build

**Status:** attiva (Ciclo 9, blocco 4)

Tutte le taglie (svg, ico, 96px, apple-touch, 192/512, maskable) escono da
`scripts/generate-favicons.ts` a partire da un solo disegno, così il set non diverge.
A differenza delle OG gli output sono committati e lo script non è nella catena di
`pnpm build`: si rilancia a mano con `pnpm generate-favicons` quando cambiano il
disegno o l'accento default. Scartati: file preparati a mano per taglia (il vecchio
set era divergente).
