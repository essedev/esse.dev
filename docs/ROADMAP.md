# Roadmap

Stato corrente del progetto. Milestone reali, non wishlist. Aggiornata insieme al codice.

Ultimo aggiornamento: 2026-10-03 (piano dell'agente in M17)

## Contesto

In produzione su `main` c'è il sito SvelteKit (M1-M10, storia in `docs/CYCLES.md`).
Il restyle "Laboratorio" (M11) è fermo e resta intero sul branch `restyle/laboratory`:
da lì si ripescano i pezzi che valgono (motivi in `docs/RESTYLE.md`). Il lavoro
riparte sul branch `astro`, creato da `restyle/base` (look di `main` più i contenuti
nuovi), con quattro milestone in sequenza: prima la piattaforma, poi lo stile, poi i
progetti, infine l'agente. La messa online aspetta che il sito sia completo (scelta di
Simone): prima ci si mette tutto.

## Milestone

### M14 - Migrazione ad Astro - Fatta sul branch `astro`, da mettere online

Sito rifatto in Astro con look neutro di partenza (scelta di Simone: un canvas da cui
partire invece della parità col look base). Log in `docs/CYCLES.md` (Ciclo 11),
scelte in `docs/DECISIONS.md` #10. Gate verde: lint, check, build, unit, E2E.

- Per andare online: controllare nelle impostazioni di Cloudflare Workers Builds che
  il comando di build sia `pnpm build`, il deploy `npx wrangler deploy` e Node almeno
  22.12; poi merge su `main` con squash (vedi Aperte) e push.

### M15 - Struttura e stile - In corso

Struttura scelta: il sito come spazio di lavoro (concept A, Ciclo 12), portato in
Astro. Fatti: due colonne alte tutta la finestra (lista e riquadro con toolbar), il
livello sopra nella toolbar e non nel contenuto, il pager in fondo al riquadro con h/l,
la lista in ordine di importanza con la sola vetrina dei progetti. Resta:

- Le pagine non ancora riviste con la shell nuova: home (Da dove iniziare resta),
  metodo, adesso, chi sono, dettaglio di uno scritto, 404; un giro completo su mobile.
- OG e favicon coerenti con lo spazio di lavoro (vedi Aperte).

### M16 - Progetti - Da fare

- Censimento dei repo (`~/Development/Projects` + GitHub `essedev`) e smistamento
  voce per voce: vetrina, registro, escluso, cliente. I lavori per clienti restano
  fuori di default; un repo privato si pubblica solo voce per voce.
- Vetrina di 6 progetti (quanti ne stanno nella lista) con criteri espliciti: coprire
  gli assi del lavoro e avere qualcosa da aprire (repo, sito, comando). Il registro
  tiene tutti gli altri. I fatti (date, attività, stack) si ricavano dalle fonti, il
  testo si scrive a mano con Simone, compresa "La scelta interessante".
- Cover per ogni progetto da un componente (colore, icona Lucide o SVG, scena di UI),
  screenshot veri dove esistono. Tag ripuliti.
- Skill che propone le voci nuove o aggiornate dai repo; propone, non pubblica.

### M17 - Agente - Da fare

Una pagina del sito (`/it/agente`, una riga nella lista) è un agente vero, con tool,
che mostra come lavora: ogni chiamata ai tool, modello, token e costo per risposta.
Prende il posto dell'idea precedente (il sito ridisegnato dal vivo da un modello).
Scelte in `docs/DECISIONS.md` #11.

- Pagina statica Astro con un'isola Svelte 5: trascrizione in stile terminale.
- Il browser si collega con `AgentClient` (Agents SDK di Cloudflare) via WebSocket a un
  Durable Object (classe `Agent` dell'SDK): una conversazione per visitatore, memoria
  in SQLite, ibernazione quando nessuno scrive. Dentro, il ciclo è pi-agent-core 1.x,
  i modelli passano da pi-ai.
- Tool di sola lettura su dati pubblici: collection del sito (progetti, scritti,
  metodo, adesso), README e file dei repo pubblici. `beforeToolCall` blocca tutto ciò
  che non è nella lista dei repo ammessi scritta nel codice. Poi, forse, una sandbox
  per eseguire codice.
- Limiti: Turnstile, limite per visitatore, budget giornaliero che spegne l'agente,
  costo misurato su un campione e approvato da Simone prima di attivarlo.
- Primo passo: prova di mezza giornata (SDK con pi dentro, un tool, streaming verso
  Svelte). Se non regge, Durable Object scritto a mano con lo stesso core; la UI non
  cambia. Prima della prova, rileggere la doc della 1.0 (il clone locale è alla 0.84).
- Da decidere: lo scopo per chi visita (proposta: un agente che lavora sui repo, con
  dentro le risposte su Simone) e il modello (Qwen su Cerebras o OpenRouter).

## Aperte

- Dominio: `esse.dev` è il principale. Da fare nel pannello Cloudflare: Redirect Rule
  301 da `simonesalerno.it` e `www.simonesalerno.it` a `https://esse.dev` con il path
  conservato. `essedev.it` non si rinnova: nessun redirect da mantenere.

- Email `hello@esse.dev`: verificare che la casella riceva prima della messa online.
- Favicon: da rifare dentro M15. Ora c'è quella di `main` (quella del laboratorio è
  rimasta sul suo branch).
- Merge su `main` con **squash**: i branch del restyle portano in
  storia circa 70 MB di PNG della pixel art scartata, che non devono entrare in `main`.

## Stato deploy

In produzione: `main` (SvelteKit). Il sito Astro è sul branch `astro`, non mergiato.
