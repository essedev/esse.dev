# Restyle "Laboratorio"

Documento di direzione per il rebrand visivo del portfolio. Traccia cosa stiamo
facendo, le idee considerate (anche quelle scartate, col perché), la vision finale
e cosa realizziamo in questa prima fase. Vive sul branch `restyle/laboratory`.

## Perché

Il sito è tecnicamente solido (SvelteKit, i18n, OG build-time, test, performance)
ma visivamente generico: dark gradient blu-nero + noise + Geist sono il preset del
"dev portfolio 2025". Manca un'identità forte e definita. Questo lavoro non tocca
l'ingegneria, ridefinisce l'identità.

## La voce (già su main)

Prima del look abbiamo sistemato il messaggio. Voce: pulita ma giovane, prima
persona, frasi corte, termini tecnici dove servono. Niente massime da artigiano,
niente buzzword da LLM, niente metriche-feticcio.

Posizionamento AI ribilanciato: AI-first ed entusiasta. L'umano non è il freno che
"valida l'AI", progetta il sistema (architettura, contesto, controlli) e per questo
va veloce. La solidità da ingegnere abilita la delega, non la limita. Edge:
ingegnere solido CHE spinge l'AI più di altri, con output production-ready, non demo.

Il vecchio welcome difensivo ("l'architettura la decide l'umano, l'AI velocizza,
l'umano valida") è stato sostituito. Anche la label dello status `idea` era diventata
"Esplorazione" / "Exploration"; sul branch è poi tornata "Idea" (Ciclo 9, blocco 4).

## Idea madre: Il Laboratorio

Il sito è il banco di lavoro di un AI engineer inventore: esperimenti in corso,
esplorazioni e cose finite. La narrazione esiste già nell'articolo
`il-mio-nuovo-laboratorio` (lo scienziato pazzo, il raccoglitore di progetti).

- **Luogo:** il laboratorio.
- **Spirito:** mago / inventore (il codice come magia), nel tono e nei dettagli,
  non come costume.
- **Esecuzione:** linguaggio visivo tecnico, da officina / sistema operativo.

## Idee considerate e scartate

- **Motif grafico "doppia S":** scartato. Le SS richiamano altro; l'handle è
  "essedev". La firma identitaria è concettuale (un'idea), non un glifo.
- **Font Jacquard 12/24 (pixel-medievale):** provato sul welcome, scartato. Bello
  ma fantasy, non fitta col posizionamento serio, e soprattutto mancava un sistema
  in cui calarlo. La firma tipografica sarà un monospace (registro tecnico), non un
  blackletter.
- **Tre direzioni di identità valutate:** Laboratorio, Sistema (terminale/macchina),
  Manifesto (editoriale type-driven). Scelta: Laboratorio come idea madre, con il
  linguaggio del Sistema nell'esecuzione. Il Manifesto è stato scartato perché
  dipende da contenuti forti ancora da scrivere.
- **Font, due round di confronto sul nome:** (1) mono - Space Mono (il bold
  schiacciava, il regular era smunto, niente pesi intermedi), JetBrains Mono, IBM
  Plex Mono, VT323, Pixelify Sans: scelto **Martian Mono** per le etichette. (2)
  serif per il titolo - Instrument Serif, Fraunces, Playfair, Spectral. Fraunces
  italic montato sull'hero e poi **scartato in contesto**: il serif italic grande
  su dark è l'estetica dei template generati da AI (v0/artifacts), troppo
  riconoscibile. Tornati a **Martian Mono** per titolo ed etichette.
- **Headline dell'hero considerate:** "Ciao, sono Simone." (scartata: spreca il
  punto di massima attenzione, il nome è già nel logo), "L'AI scrive. Io decido.",
  "Architettura mia, codice suo.", "Half engineer, half wizard.", più "Welcome to
  my lab" e "where code feels like magic" (scartate: cliché tech triti). Scelta:
  **"I cast code."**
- **Accento colore:** arancione deep (scartato: complementare al logo blu, ci
  litigava), viola (scartato: armonizza col logo ma è il cliché-AI / purple
  gradient), ciano `#22d3ee` (primo candidato, stessa famiglia fredda del logo e
  retro-CRT), poi rifinito nell'**azzurro elettrico `#2cc3f7`** in uso (vedi sotto).
  Arancione e viola sono rientrati solo come alternative dell'accent picker.

## Pixel art autoprodotta: SCARTATA (2026-09-21)

Idea abbandonata: costo di produzione troppo alto per il valore. Il render AI è
"finta" pixel art (griglia non reale, anti-aliasing, glow) e un convertitore
deterministico non ci arriva su soggetti organici in prospettiva: il dettaglio fine
(es. il chip sul cappello) si perde e va reiniettato a mano. La pixel art vera si
disegna nativa su griglia, cioè è lavoro da pixel artist, fuori dal perimetro del
restyle. Gli script sperimentali e i concept generati sono archiviati in
`docs/archive/pixel-art/` (`scripts/` e `concepts/`): si leggono, non si aggiornano.

Cosa era previsto, per memoria: la firma visiva sarebbe stata pixel art prodotta con
`idkcraft-studio` (base AI ad alta risoluzione, poi downscale + quantizzazione CIELAB
su palette).

- **Robottino AI pixelato** come compagno del laboratorio: incarna il rapporto
  human+AI in modo immediato.
- **Scene animate** del lab (loop semplici: io che lavoro, il robottino che
  galleggia / emette una lucina, vapore, scintille).
- **Perché è forte:** la firma visiva _dimostra_ la tesi del welcome (l'umano
  imposta il sistema, l'AI genera, il processo deterministico valida) invece di
  descriverla a parole. Nessun altro portfolio ha questo.

Note di fattibilità (da tenere a mente quando ci arriveremo):

- Lato sito è leggero: spritesheet + CSS `steps()`, pochi KB, `prefers-reduced-motion`
  già gestito.
- Il pezzo difficile è la produzione: l'animazione richiede coerenza frame-to-frame
  (l'AI è debole lì); il tool oggi genera solo texture 16x16 statiche per un voxel
  game e va esteso (dimensioni, palette dedicata, modulo animazione).
- Strategia: partire da UNA scena hero curata, non animare tutto. La prima scena si
  può validare anche semi-manualmente, senza aspettare che il tool sia pronto.
- Bonus: `idkcraft-studio` può diventare esso stesso un progetto del portfolio (il
  sistema che ha disegnato il sito).

## Cosa facciamo ORA (questo branch, senza pixel art)

Design system di base, su cui la pixel art si poserà in seguito. Decisioni prese:

- **Colore:** dark, nero piatto (`#0c0c0c`) + superfici carbone/zinc + accento
  **azzurro elettrico** (`#2cc3f7`). Via il gradient blu di sfondo e il noise
  generico. L'azzurro sta nella famiglia fredda del logo (coeso) ma saturo e
  brillante (CRT/neon), non il blu desaturato generico. Glow azzurro dal basso come
  orizzonte. Iter colore: arancione scartato (complementare al logo, ci litigava),
  viola (cliché-AI), blu-logo (troppo generico/desaturato), azzurro elettrico vince.
- **Tipografia:** **IBM Plex Sans** per il body (toglie il sapore Vercel di Geist),
  **Martian Mono** per titoli ed etichette tech (firma, stato, metadati, numeri).
  Mono geometrico "da officina", peso medium sul titolo. (Fraunces italic provato sul
  titolo e scartato in contesto: il serif-su-dark grande dà l'aria "template generato
  da AI". Il mono è meno elegante ma più specifico e meno omologato.)
- **Headline hero:** titolo **"I write the spells."** (2026-09-24), che sostituisce
  "I cast code.". Quel doppio senso (type cast e incantesimo) si scioglieva solo
  leggendo "half wizard" più sotto e non diceva cosa faccio; "I write the spells" tiene
  il mago al posto giusto: io scrivo l'incantesimo (architettura, contesto, controlli),
  l'AI lo lancia. Il corpo sotto è asciugato a tre frasi, una per riga da `lg`, senza
  ripetere due volte che l'AI scrive il codice. Varianti in `docs/concepts/hero-variants.html`. Resta in inglese anche in IT (brand statement intraducibile; il corpo sotto
  è localizzato). Sostituisce "Ciao, sono Simone." (il nome era già nel logo). Layout
  **allineato a sinistra** (editoriale, respiro a destra per la futura scena pixel
  art), non centrato.
- **Nome:** niente eyebrow-kicker sopra il titolo (troppo template e ridondante col
  logo). Il nome è la **firma in calce** all'hero - "Simone Salerno · AI Engineer"
  (mono, ruolo in azzurro): firma il pezzo invece di presentarsi.
- **Sfondo:** nero piatto + griglia tecnica in prospettiva ancorata in basso
  (il pavimento della "stanza") che sfuma salendo. Profondità di spazio senza
  chiudersi a clessidra.
- **Card:** squadrate, bordo 1px, intestazione in mono coi metadati (stato/anno).
  Hover: il bordo prende l'azzurro + micro-lift verticale. Niente rotazione.
- **Filtri:** logica invariata (è testata), restyle a "toolbar di strumenti":
  label in mono, attivi in azzurro.
- **Motion:** da rifare come SISTEMA coerente a fine restyle, non a mano sul singolo
  componente. Tarare l'animazione alla cieca (senza vedere il movimento negli
  screenshot) non converge: per ora hero con fade base sobrio, custom rimandate.
  Registro voluto: fluido ma non lento, easing che decelera (expoOut), non il
  "secco/veloce" che risultava brusco. `prefers-reduced-motion` gestito.
- **Navbar:** logo testuale `essedev` (mono, "dev" azzurro). L'icona pixel
  Windows-95 stonava per palette e stile ed è stata rimossa; il cursore `_` finale è
  stato tolto dal wordmark. Voci come indice numerato (`01 progetti`...) coi numeri
  mono azzurri, lingua in mono. Hamburger sotto 1024px.
- **Status bar:** fascia sotto la navbar (al posto del border piatto), stile barra
  di stato IDE: dot azzurro + ruolo a sinistra, location/lingue a destra. La firma
  dell'hero usa "half engineer, half wizard" per non duplicare il ruolo.
- **Footer:** pannello tecnico (link a moduli, motion toggle), in mono sobrio. Il
  last-updated derivato dal git era previsto ma non è stato implementato.

## Cosa rimandiamo

- **Animazioni:** fase successiva, dopo che l'estetica di base regge. (La pixel art
  è stata scartata, vedi sopra.)
- ~~**Contenuti dei progetti**~~: fatto nel blocco 4 (selezione ridotta, copy
  riscritto in prima persona, vetrina + indice).

## Stato (2026-09-22)

- Voce + label "Esplorazione" su `main` (deployate).
- Branch `restyle/laboratory` (non mergiato). **Fatto:** palette, tipografia, hero,
  navbar (logo testuale + indice numerato + status bar + toggle lingua), card
  progetti/articoli a scheda d'archivio + badge, filtri mono, footer, back-to-top,
  arrotondamento via token, shortcut tastiera (1-4 sezioni, 0/Home top, End fondo),
  `//` rimosso dal content. Pagine dettaglio (tag mono squadrati + immagine a token),
  paginazione a indice numerato (`01 / 04`, accento), 404 in mono accent, link
  contatti e chip filtri allineati all'accento.
- **Polish (blocco 2):** footer "dashboard" (link a moduli con icona, switch
  meccanico), bottoni uniformati a un solo standard, sitemap restilizzata, status bar
  col claim `Human vision · AI execution` (via dot e lingua duplicata), StatusBadge a
  quadratino, tema accento centralizzato (`color-mix` dal token) e **accent picker**
  runtime (azzurro default + arancione/viola, hue sweep animato, flottante basso-sx,
  persistente, rispetta il motion toggle).
- **Telaio (blocco 3):** il sito è dentro una cornice fissa (`Chassis.svelte`) che
  porta stato vivo - sezione corrente, avanzamento scroll come scala, ora di Milano,
  claim - invece di decorazione. I controlli non galleggiano più sopra la pagina: accent
  picker e lingua sono strumenti del rail sinistro, il back-to-top è il piede della
  scala a destra. Via la floating nav, che duplicava la navbar: una sola superficie di
  navigazione, barra di link allineata alla colonna del contenuto. Ogni sezione apre con
  un header a indice numerato + readout calcolato dai dati (progetti: quanti e da
  quando). Sotto `lg` il telaio non si monta e vale l'assetto precedente.
- **Contenuti e densità (blocco 4):** progetti ricurati (gli esclusi depubblicati,
  non cancellati), listing a due densità (card per in corso/completati, indice
  tipografico per archiviati/idee), articoli come indice, contatti asciugati, prima
  dose statica di CRT (vignetta del telaio, glow al fosforo, scanline sulle
  miniature), favicon e manifest generati da un solo disegno.
- **Resta:** animazioni come sistema. Prima del merge:
  `build` + `test:ci` (con E2E da aggiornare per nav/welcome/badge) + merge su `main`.
- Log dettagliato in `docs/CYCLES.md` (Ciclo 9).
