# Roadmap

Stato corrente del progetto. Milestone reali, non wishlist. Aggiornata insieme al codice.

Ultimo aggiornamento: 2026-10-03

## Contesto

In produzione su `main` c'è il sito SvelteKit (M1-M10, storia in `docs/CYCLES.md`).
Il restyle "Laboratorio" (M11) è fermo e resta intero sul branch `restyle/laboratory`:
da lì si ripescano i pezzi che valgono (motivi in `docs/RESTYLE.md`). Il lavoro
riparte sul branch `astro`, creato da `restyle/base` (look di `main` più i contenuti
nuovi), con quattro milestone in sequenza: prima la piattaforma, poi lo stile, poi i
progetti, infine il tocco AI. Regola di ogni sessione: finisce con qualcosa che si
può mettere online.

## Milestone

### M14 - Migrazione ad Astro a parità di sito - In corso (branch `astro`)

Stesso sito di `restyle/base`, rifatto in Astro. Nessun cambio di stile.

- Scaffold con i comandi ufficiali: Astro, adapter Cloudflare, Tailwind 4,
  integrazione Svelte per le isole interattive (filtri, menu, switch animazioni).
- Content collections con gli schemi Zod di oggi; i corpi passano da blocchi JSON a
  Markdown con uno script di migrazione, così il renderer dei blocchi non si porta.
- i18n: route con prefisso di lingua, slug tradotti e selettore lingua sulla pagina
  equivalente (Astro non li fa da solo: si portano le funzioni pure di `i18n.ts`),
  redirect intelligenti in un middleware.
- OG pre-generate, sitemap, RSS, header di sicurezza e CSP.
- Test: unit sulle funzioni pure, E2E adattati, confronto a screenshot col sito
  attuale pagina per pagina.
- Fatto quando: gate verde e nessuna differenza visibile rispetto a `restyle/base`.

### M15 - Stile - Da fare

Si migliora il look base senza snaturarlo, più un tocco cyberpunk delicato (due o
tre segnali, non un telaio: accento neon su fondo scuro, glitch leggero in hover,
mono per i metadati). Varianti A/B/C in un file HTML in `docs/concepts/`, al massimo
due giri per scelta. Dentro: liste invece della griglia dove i contenuti sono pochi,
ritmo verticale, dettaglio progetto a due colonne, contatti, testi tradotti ovunque.

### M16 - Progetti - Da fare

- Censimento dei repo (`~/Development/Projects` + GitHub `essedev`) e smistamento
  voce per voce: vetrina, registro, escluso, cliente. I lavori per clienti restano
  fuori di default; un repo privato si pubblica solo voce per voce.
- Due livelli: vetrina (6-10 progetti con pagina scritta) e registro (una riga per
  progetto). I fatti (date, attività, stack) si ricavano dalle fonti, il testo si
  scrive a mano.
- Cover per ogni progetto da un componente (colore, icona Lucide o SVG, scena di UI),
  screenshot veri dove esistono.
- Skill che propone le voci nuove o aggiornate dai repo; propone, non pubblica.

### M17 - Tocco AI: modalità live - Da fare

Il sito si ridisegna dal vivo con un modello veloce (oggi Qwen 3.8 27B su Cerebras)
a partire dagli stessi dati. Prima un prototipo in mezza giornata con due varianti
(A: solo CSS sull'HTML fisso; B: template libero con segnaposto riempiti da noi), con
direzioni artistiche curate. Se 3 direzioni su 5 non convincono, si abbandona. Se
regge: stili pronti generati ogni giorno e validati, pulsante "riscrivi dal vivo",
endpoint Worker con chiave, cache e tetto di spesa approvato prima.

## Aperte

- Email `hello@esse.dev`: verificare che la casella riceva prima della messa online.
- Favicon: da rifare dentro M15 (quella del laboratorio è rimasta sul suo branch).
- Merge su `main` a fine M14 o M15 con **squash**: i branch del restyle portano in
  storia circa 70 MB di PNG della pixel art scartata, che non devono entrare in `main`.

## Stato deploy

In produzione: `main` (SvelteKit). Nessun branch del restyle è mergiato.
