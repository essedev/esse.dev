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

## #6 - Progetti esclusi si depubblicano, non si cancellano

**Status:** attiva (Ciclo 9, blocco 4)

Un progetto che esce dal portfolio passa a `published: false` in `meta.json` e resta
nel repo, recuperabile senza scavare nella storia git. Scartata: cancellare la
cartella del progetto.

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
telaio non c'è). I tre sistemi confrontati sono in `docs/concepts/system-variants.html`.

## #10 - Astro statico, Worker solo per lingua e redirect

**Status:** attiva (Ciclo 11)

Il sito è contenuto, non un'applicazione: tutte le pagine sono prerenderizzate e il
Worker gira solo per la root (lingua da `Accept-Language`) e per un catch-all che fa
un solo redirect al canonico o risponde 404. Ogni contenuto è `meta.json` condiviso
più un Markdown per lingua, in due content collection unite da `src/lib/content.ts`.
Scartati: SSR di tutte le pagine come in SvelteKit (compute e latenza per pagine che
non cambiano), l'i18n di Astro (non traduce segmenti né slug), un JSON per lingua con
i campi condivisi duplicati (deriva tra lingue), il corpo a blocchi JSON (illeggibile
da scrivere e nei diff).

## #11 - Agente del sito: PiHarness dell'Agents SDK, modelli da OpenRouter

**Status:** attiva (Ciclo 13, confermata dalla prova)

L'agente gira sul server, mai nel browser, in un Durable Object per visitatore che ospita
pi-durable con `PiHarness` (`agents/harness/pi`, beta): conversazione e ripresa dopo una
sospensione sono di pi, il Durable Object dà storage e risveglio. I modelli passano da
OpenRouter (`src/agent/models.ts`): `glm-5.3-flash` sui provider più veloci in ordine
(BaseTen, Fireworks, Parasail), con passaggio automatico al successivo. Con Workers AI
la stessa domanda impiegava circa 40 s, con OpenRouter circa 7. L'interfaccia è un'isola
Svelte con `AgentClient`. Scartati: Workers AI e AI Gateway (catalogo ridotto e a volte
in ritardo, nessuna scelta del provider, crediti comunque necessari per i modelli di terze
parti), Cerebras diretto (oggi serve solo due modelli), pi-agent-core collegato a mano
(riscriveva la durabilità di `PiHarness`), pi-server e pi-client (sperimentali), React con
assistant-ui (aspetto generico, formato dell'AI SDK).

## #12 - Limiti dell'agente in costo reale, con un triage davanti

**Status:** attiva (Ciclo 13)

Ogni visitatore ha un budget giornaliero in dollari e il sito un tetto globale
(`src/agent/budget.ts`, `Ledger`): si scala il costo reale di ogni risposta, calcolato da
pi-ai, non il numero di messaggi. Prima del modello Jev (TypeSafe, su Workers AI)
classifica intento, peso e lingua in meno di un secondo: fuori tema e abuso si fermano
lì. Si ferma quando la probabilità di essere fuori tema (fuori tema più abuso) arriva a
0,65, o quella di abuso a 0,5: soglie fissate su 54 messaggi etichettati (`pnpm eval:jev`),
con 0 domande legittime fermate e 1 su 19 da fermare passata. Se Jev non risponde la
richiesta passa: il tetto in costo reale resta la garanzia.
Jev passa da OpenRouter con la stessa chiave del modello; TypeSafe diretto e Workers AI
restano come trasporti alternativi (`JEV_TRANSPORT`).
Scartati: un numero fisso di messaggi per visitatore (rigido, ignora quanto costa una
domanda), il solo triage senza tetto (una classificazione si può ingannare).
