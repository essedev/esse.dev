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

- Fatto (prova): pagina `/it/agente` con isola Svelte, WebSocket verso un Durable
  Object per visitatore con pi-durable dentro (`PiHarness`), modelli dal binding `AI`,
  tool `search_site` sull'indice del sito. Due domande vere: il modello chiama il tool,
  risponde con i path giusti, lo streaming arriva.
- Fatto dopo la prova: modello `glm-5.3-flash` per tutto (indice Artificial Analysis 42,
  0,15/0,50 $ per milione; una domanda con due tool costa circa 0,07 centesimi);
  `read_page`; Markdown sicuro nelle risposte, ragionamento chiuso, token e costo per
  risposta. Triage con Jev e limite in costo reale (`docs/DECISIONS.md` #12).
- Jev (modello di terze parti su Workers AI) richiede crediti AI Gateway: senza, il
  triage fallisce ("Insufficient AI Gateway credits") e i messaggi passano senza triage.
  Da fare da Simone: caricare crediti (unified billing, +5% sull'acquisto).
- Da valutare: `@cloudflare/computer` (clona i repo in un workspace ed esegue JavaScript
  in un Dynamic Worker) al posto dei tool sull'API di GitHub, unito a `run_code`.
- Tool di sola lettura su dati già pubblici. Niente scritture, fetch di URL liberi,
  repo privati, memoria tra visite.
  - Sito, da un indice JSON generato a build: `search_site`, `list_projects` (filtri
    del registro), `read_page(path)`.
  - Repo pubblici: `repo_overview`, `list_files`, `read_file` (righe limitate),
    `search_code`, `recent_activity`. Ammessi solo i `repo` dei progetti pubblicati
    più il repo del sito (l'agente legge le proprie definizioni e il proprio prompt);
    `beforeToolCall` blocca il resto. Token GitHub di sola lettura, senza privati.
  - Interfaccia, eseguito dal browser: `open_page(path)` apre la voce nel riquadro e
    la evidenzia nella lista.
- Tool dimostrativi, uno per capacità dell'harness, ognuno coi limiti nel codice:
  - `render(spec)`: grafici, tabelle, confronti disegnati dal client coi token del
    sito; specifica dichiarativa, mai HTML (CSP).
  - `run_code(code)`: code mode, JavaScript in un isolate usa e getta (Dynamic Workers,
    piano Workers a pagamento), può chiamare solo gli altri tool, niente rete.
  - `delegate(tasks[])`: 2-3 sotto-agenti in parallelo costruiti sopra il core (pi non
    li ha per scelta), con tetto di agenti e token.
  - `draft_message(text)`: messaggio a Simone che parte solo se chi visita lo approva
    (gate umano), con Turnstile e limite per visitatore.
- Ordine: base più auto-lettura, poi `render` e `run_code`, poi `delegate` e
  `draft_message`. Scartati: un secondo modello da consultare, fetch libero, voce e
  immagini.
- Limiti: Turnstile, limite per visitatore, budget giornaliero che spegne l'agente,
  costo misurato su un campione e approvato da Simone prima di attivarlo.
- Deciso: l'agente lavora sui repo e risponde anche su Simone; modelli da AI Gateway.

## Aperte

- Dominio: `esse.dev` è il principale. Da fare nel pannello Cloudflare: Redirect Rule
  301 da `simonesalerno.it` e `www.simonesalerno.it` a `https://esse.dev` con il path
  conservato. `essedev.it` non si rinnova: nessun redirect da mantenere.

- Analytics: lo script di Umami punta a `umami.essedev.it`, ma `essedev.it` non si
  rinnova. Spostare Umami su un sottodominio di `esse.dev` prima della scadenza, o le
  statistiche si fermano senza errori.
- Email `hello@esse.dev`: verificare che la casella riceva prima della messa online.
- Favicon: da rifare dentro M15. Ora c'è quella di `main` (quella del laboratorio è
  rimasta sul suo branch).
- Merge su `main` con **squash**: i branch del restyle portano in
  storia circa 70 MB di PNG della pixel art scartata, che non devono entrare in `main`.

## Stato deploy

In produzione: `main` (SvelteKit). Il sito Astro è sul branch `astro`, non mergiato.
