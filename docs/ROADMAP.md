# Roadmap

Stato corrente del progetto. Milestone reali, non wishlist. Aggiornata insieme al codice.

Ultimo aggiornamento: 2026-10-04 (Ciclo 19: il vetro, l'agente che chiacchiera, i limiti per IP)

## Contesto

In produzione su `main` c'è il sito SvelteKit (M1-M10, storia in `docs/CYCLES.md`).
Il restyle "Laboratorio" (M11) è fermo e resta intero sul branch `restyle/laboratory`:
da lì si ripescano i pezzi che valgono (motivi in `docs/archive/RESTYLE.md`). Il lavoro
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
  22.12; caricare il secret `OPENROUTER_API_KEY` (`wrangler secret put`), senza il
  quale l'agente non risponde, e `GITHUB_TOKEN` (fine-grained, sola lettura dei repo
  pubblici), senza il quale i tool sul codice hanno 60 richieste l'ora per IP condiviso;
  per `draft_message`: Email Routing attivo su `esse.dev` con l'indirizzo di arrivo
  verificato, i secret `MAIL_TO` e `TURNSTILE_SECRET` e la variabile di build
  `PUBLIC_TURNSTILE_SITE_KEY` di un widget Turnstile vero (senza, vale la chiave di prova
  che passa sempre); poi merge su `main` con squash (vedi Aperte) e push.

### M15 - Struttura e stile - In corso

Struttura scelta: il sito come spazio di lavoro (concept A, Ciclo 12), portato in
Astro. Fatti: due colonne alte tutta la finestra (lista e riquadro con toolbar), il
livello sopra nella toolbar e non nel contenuto, il pager in fondo al riquadro con h/l,
la lista in ordine di importanza con la sola vetrina dei progetti. Stile dal concept B
(Ciclo 17, per DECISIONS #15): lavanda e verde per gli stati vivi, Departure Mono, velo
CRT, finestra con due card su schermo largo; home snellita con l'agente in testa. Su
mobile la finestra con il riquadro e la lista in un cassetto (Ciclo 18), rifiniture
chiuse nel Ciclo 19. La finestra di vetro su uno sfondo colorato (Ciclo 19, per
DECISIONS #16). Resta:

- OG e favicon: Simone sceglie tra le proposte del concept D
  (`docs/concepts/concept-d-og.html`), poi si applicano all'endpoint OG e alle favicon.
- L'altezza della lista oltre i 900 px.

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

### M17 - Agente - In corso

Una pagina del sito (`/it/agente`, una riga nella lista) è un agente vero, con tool,
che mostra come lavora: ogni chiamata ai tool, modello, token e costo per risposta.
Prende il posto dell'idea precedente (il sito ridisegnato dal vivo da un modello).
Scelte in `docs/DECISIONS.md` #11-#14.

- Fatto (Ciclo 14): Durable Object per visitatore con pi-durable, `glm-5.3-flash` da
  OpenRouter, `search_site` e `read_page`, triage con Jev valutato su un set etichettato,
  limite in costo reale per visitatore e per il sito, trascrizione con token e costo.
- Fatto (Ciclo 15): `list_projects`, `show_page` (scheda da aprire) e i tool sui repo
  pubblici via API di GitHub (#13). Il repo del sito si legge dal ramo `main`: fino al
  merge l'agente vede il sito vecchio.
- Fatto (Ciclo 16): i tool dimostrativi, uno per capacità, coi limiti nel codice:
  `render` (barre, tabelle, linee del tempo), `run_code` (Code Mode in un Dynamic
  Worker), `delegate` (2-3 sotto-agenti di pi-durable), `draft_message` (bozza che il
  visitatore manda, dopo Turnstile). Scelte in #14.
- Fatto (Ciclo 19): le chiacchiere passano al modello, che risponde breve e senza tool
  (#12); limiti per IP, raffica di 10 messaggi al minuto e 50 centesimi al giorno (#17);
  red team: 10 attacchi nel set di Jev, superato anche dal vivo. Niente allowlist dei
  link esterni finché le conversazioni non sono condivisibili (#18).
- Tool di sola lettura su dati già pubblici. Niente scritture, fetch di URL liberi,
  repo privati, memoria tra visite. L'unico effetto fuori dal sito è l'email di
  `draft_message`, e parte solo da un clic del visitatore.
- Da fare: gli eventi dei sotto-agenti dal vivo nella pagina (oggi si vedono a lavoro
  finito); `@cloudflare/computer` solo se servisse eseguire il codice dei repo.
- Da misurare con traffico vero: se il peso stimato da Jev prevede il costo reale delle
  risposte (ci sono entrambi per ogni messaggio). Solo se lo prevede bene, usarlo per
  scegliere quali tool offrire; oggi il peso si mostra e basta.
- Prima di attivarlo in produzione: costo misurato su un campione e approvato da Simone.
  Misure in anteprima: una domanda semplice 0,05-0,1 centesimi, una con `run_code` circa
  0,15, una con `delegate` circa 0,9 col tetto per figlio (era 1,4; budget di 10 centesimi
  al giorno per visitatore, mostrato in crediti).
  Scartati: un secondo modello da consultare, fetch libero, voce e immagini.
- Deciso: l'agente lavora sui repo e risponde anche su Simone; modelli da OpenRouter
  (#11).

## Aperte

- Dominio: `esse.dev` è il principale. Da fare nel pannello Cloudflare: Redirect Rule
  301 da `simonesalerno.it` e `www.simonesalerno.it` a `https://esse.dev` con il path
  conservato. `essedev.it` non si rinnova: nessun redirect da mantenere.

- Analytics: lo script di Umami punta a `umami.essedev.it`, ma `essedev.it` non si
  rinnova. Spostare Umami su un sottodominio di `esse.dev` prima della scadenza, o le
  statistiche si fermano senza errori.
- Email `hello@esse.dev`: verificare che la casella riceva prima della messa online.
- Favicon: ora c'è quella di `main`; quella nuova esce dal concept D (M15).
- Merge su `main` con **squash**: i branch del restyle portano in
  storia circa 70 MB di PNG della pixel art scartata, che non devono entrare in `main`.

## Stato deploy

In produzione: `main` (SvelteKit). Il sito Astro è sul branch `astro`, non mergiato.
