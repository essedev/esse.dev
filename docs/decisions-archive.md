# Decisions - archivio

Voci di `docs/DECISIONS.md` non più attive. La numerazione è quella globale: i
riferimenti `#N` restano validi. #5, #7, #8 e #9 sono state sospese con il ritorno allo
stile base (Ciclo 10) e il loro oggetto non esiste più nel sito Astro; restano intere
sul branch `restyle/laboratory`.

## #4 - Una sola superficie di navigazione, barra `fixed`

**Status:** superata da #10 (Ciclo 11): con Astro non c'è più `overflow-x: hidden` sul container, l'header è `sticky` e la floating nav non esiste

Rimossa la floating nav, che duplicava la navbar; i controlli persistenti vanno nel
telaio (`Chassis.svelte`). La barra è `fixed` e non `sticky`: `overflow-x: hidden` su
body e container (necessario alla griglia da 300vw) rende l'antenato lo scrollport e
lo sticky non si aggancerebbe mai. Scartate: floating nav + navbar, sticky.

## #5 - Listing progetti a due densità, senza paginazione

**Status:** sospesa su `restyle/base` (Ciclo 10), era attiva (Ciclo 9, blocco 4)

In corso e completati come card con immagine (vetrina), archiviati e idee come indice
tipografico a una riga (`utils/shelf.ts`, `EntryIndex`). Il listing progetti non è
paginato: la paginazione taglierebbe a metà le due densità e la collezione resta
piccola per scelta curatoriale. Gli articoli restano paginati. Scartata: griglia unica
di card paginata.

## #7 - Favicon generate da script, output committati fuori dalla build

**Status:** sospesa su `restyle/base` (Ciclo 10), era attiva (Ciclo 9, blocco 4)

Tutte le taglie (svg, ico, 96px, apple-touch, 192/512, maskable) escono da
`scripts/generate-favicons.ts` a partire da un solo disegno, così il set non diverge.
A differenza delle OG gli output sono committati e lo script non è nella catena di
`pnpm build`: si rilancia a mano con `pnpm generate-favicons` quando cambiano il
disegno o l'accento default. Scartati: file preparati a mano per taglia (il vecchio
set era divergente).

## #8 - Token e materiali: nessun valore visivo scritto a mano nei componenti

**Status:** sospesa su `restyle/base` (Ciclo 10), era attiva (Ciclo 9, blocco 5)

Raggi, linee, superfici e taglie del mono vivono come token nel `@theme` e ogni
contenitore, chip, campo o etichetta usa una classe di `@layer components`
(`.panel`, `.chip`, `.field`, `.label`, `.key*`, `.section`). Prima ogni componente
sceglieva la sua opacità di bordo e il suo raggio: undici raggi e otto bordi per lo
stesso concetto. Una classe in più costa una riga; un valore in più costa la
coerenza. Scartato: linee guida scritte senza classi (non reggono al secondo
componente).

## #9 - Dispositivo con schermo: hardware fuori, software dentro

**Status:** sospesa su `restyle/base` (Ciclo 10), era attiva (Ciclo 9, blocco 5), sostituisce la prima versione (keycap ovunque)

Il telaio è un oggetto fisico: scocca e keycap (rail, lingua, LED, torna-su, fascia
della navbar). Lo schermo mostra software: pannelli, pulsanti, chip e campi sono
piatti e la profondità è solo luce. La prima versione portava il keycap anche dentro
lo schermo ed era uno skeuomorfismo dentro uno skeuomorfismo. Scartati: il tasto
"illuminato" con fondo d'accento tenue (a riposo leggeva come disabilitato), il
"pannello di controllo" tutto fisico (non regge la prosa lunga né mobile, dove il
telaio non c'è). I tre sistemi confrontati sono in `docs/archive/concepts/system-variants.html`.
