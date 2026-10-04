# Progetti

Come si scelgono e si raccontano i progetti del sito (M16 in `docs/ROADMAP.md`). Le schede
stanno in `src/content/projects/`, la vetrina in `src/config/featured.json`. Il repo è
pubblico e l'agente ne legge i doc: qui va solo quello che si può pubblicare. Le voci
riservate (clienti, lavori di altri, progetti da non nominare) non si scrivono in nessun
file del repo.

## Principi

1. **Le idee hanno una storia.** Un progetto si racconta con le iterazioni che l'hanno
   preceduto, anche quelle abbandonate, per trasparenza: la stessa che il sito dichiara
   sul lavoro con l'AI. Le iterazioni sono dati, non solo prosa (vedi Campo `previously`).
2. **Famiglie, non schede isolate.** Un tema che torna diventa una voce sola che racconta
   i tentativi in ordine, invece di tante schede da pochi commit.
3. **Il bisogno vero si dice.** Il contesto personale da cui nasce un progetto ("da quando
   mi sono trasferito a Milano") vale più di un elenco di funzioni.
4. **Lo stato è onesto.** Un'idea è un'idea, un sito per un cliente è un sito; quello che
   è invecchiato si aggiorna prima di mostrarlo, o resta nascosto.
5. **Discrezione dove serve.** Una competenza si può raccontare senza nominare i
   prodotti: il capitolo crypto parla di SolPlace e descrive il resto senza nomi.
6. **In alto le idee ambiziose e la misura.** Sistemi di agenti, harness che non si
   ingannano, ricerca con i numeri: è il profilo. I siti per clienti stanno in fondo.

## Voce

Vale per tutto il sito: schede, pagine, articoli.

- Prima persona, pulita ma giovane, frasi corte e dirette; termini tecnici dove servono
  ("review", "prod"), senza esagerare col gergo.
- AI-first ed entusiasta, mai difensiva: l'umano non è il freno che valida l'AI, progetta
  il sistema (architettura, contesto, controlli) e per questo può andare veloce. La
  solidità da ingegnere è ciò che permette di delegare di più, non ciò che lo limita.
- Banditi: massime da artigiano navigato ("il mestiere", "il valore non è X, è Y"), tono
  filosofico, buzzword da LLM (actionable, leverage), metriche gonfiate.
- Registro per stato: un progetto vero è una storia tecnica; un'idea o uno spike è una
  scheda corta (cosa, cosa ho imparato, perché si è fermato).

## Campo `previously`

Da aggiungere allo schema in `src/content.config.ts`: le iterazioni precedenti di un'idea,
`previously: [{ name, year, note }]` in `meta.json`, mostrate nella scheda come una
piccola linea del tempo ("prima era..."). Facoltativo; la scheda della famiglia lo usa per
i tentativi che non hanno una voce propria.

## Smistamento

Deciso con Simone il 2026-10-04. Le voci senza scheda oggi vanno create.

**Vetrina** (6): Relay, Nexus, pgbee, Zeno, mcpbelt, Portsage. Zeno è privato: scheda
senza link al repo.

**Registro**:

- printor: LLM che legge gli 8-K, harness a prova di autoinganno.
- Wavelength: radio AI con redazione multi-agente.
- Hearth (repo `home-media`): il server di casa e l'app per la TV (vedi sotto).
- Watch-OS: firmware per uno smartwatch client vocale di un agente.
- Assistenti personali, voce unica: nanoclaw, Bob, Life Terminal, Almanac. La prima
  iterazione è Verbosa (2025), chat multi-provider in Flutter con backend Go: il primo
  client e harness verso i modelli.
- IDKCraft: voxel game in Kotlin, con IDKCraft Studio che genera le texture in pixel art
  via modelli di immagini, con immagini di riferimento per tenere lo stile.
- Localhost, voce unica sugli LLM in locale: Local LLM Eval e LLM Dash.
- Milano, voce unica: based-routing (trip planner multi-origine sulla rete lombarda) e
  Milanoz, col contesto del trasferimento a Milano nel 2026.
- Server personali, voce unica: monitor (`status.esse.dev`) e server-ops.
- Esperimenti su Solana, voce unica: SolPlace con nome, il resto senza.
- doppia.os: uno dei primi progetti con l'AI, mentre arrivavano i coding agent. L'effetto
  molla sul trascinamento delle finestre, prima scritto a mano in Svelte e poi con l'AI;
  oggi una cosa così è un benchmark per i modelli locali. La storia è la scheda.
- Ethicode.
- Pigeon, Flux (esce dalla vetrina), Budokan (sito su `budokan-v2`), L.R.L. Elettrica.

**Idee**: Maia, con Cosmoscope e Upstream come iterazioni precedenti; Minerd, l'idle game
come base di un gioco che si aggiorna da solo con l'AI.

**Fuori**: Horizon e Casussy (quasi nessun lavoro), Templator (nascosto finché non si
aggiorna), Haystack, CORE, Didattica Integrata, Kebabbivori, CamperPlan.

## Hearth

Si racconta come il server di casa e le app che lo usano, non come un client torrent:
launcher multi-app su un backend unico, media server che fa partire il video mentre
scarica (remux in fMP4 per il browser), app per la TV Samsung (Tizen, in sideload) che
sostituisce lo stack CasaOS + Jellyfin. Il protocollo si nomina una volta, senza
indexer né fonti.

Screenshot solo da un'istanza dimostrativa con film a licenza libera, caricati come file
già sul disco (la libreria li accetta senza passare dalla ricerca): i film aperti della
Blender Foundation (Big Buck Bunny, Sintel, Tears of Steel, Spring) e i pubblico dominio
dell'Internet Archive. Nessuna locandina di film commerciali in quadro, neanche dai
metadati.
