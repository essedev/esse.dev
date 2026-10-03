# Decisions

Decisioni che vincolano il futuro e avevano un'alternativa reale scartata. Voci
numerate e citabili come `#N`; status: `proposta`, `attiva`, `superata da #M`,
`assorbita in <doc>`. Il "cosa è stato fatto" sta in `docs/CYCLES.md`.

Le scelte strutturali di fondo (contenuti JSON senza DB, i18n hand-rolled, slug map
derivata, OG a build time) sono spiegate in `docs/ARCHITECTURE.md`; quelle di identità
visiva (palette, font, hero, pixel art scartata) in `docs/archive/RESTYLE.md`.

Le voci non più attive (superate o sospese con il ritorno allo stile base e la
riscrittura in Astro) stanno in `docs/decisions-archive.md`, con la stessa numerazione.

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

## #6 - Progetti esclusi si depubblicano, non si cancellano

**Status:** attiva (Ciclo 9, blocco 4)

Un progetto che esce dal portfolio passa a `published: false` in `meta.json` e resta
nel repo, recuperabile senza scavare nella storia git. Scartata: cancellare la
cartella del progetto.

## #10 - Astro statico, Worker solo per lingua e redirect

**Status:** attiva (Ciclo 11)

Il sito è contenuto, non un'applicazione: tutte le pagine sono prerenderizzate e il
Worker gira solo per la root (lingua da `Accept-Language`) e per un catch-all che fa
un solo redirect al canonico o risponde 404. Ogni contenuto è `meta.json` condiviso
più un Markdown per lingua, in due content collection unite da `src/lib/content.ts`.
Scartati: SSR di tutte le pagine come in SvelteKit (compute e latenza per pagine che
non cambiano), l'i18n di Astro (non traduce segmenti né slug), un JSON per lingua con
i campi condivisi duplicati (deriva tra lingue), il corpo a blocchi JSON (illeggibile
da scrivere e nei diff). Dal Ciclo 14 il Worker instrada anche `/agents/site-agent/*`
verso il Durable Object dell'agente (#11); le pagine restano tutte statiche.

## #11 - Agente del sito: PiHarness dell'Agents SDK, modelli da OpenRouter

**Status:** attiva (decisa nel Ciclo 13, confermata dalla prova nel Ciclo 14)

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

**Status:** attiva (Ciclo 14)

Ogni visitatore ha un budget giornaliero in dollari e il sito un tetto globale
(`src/agent/budget.ts`, Durable Object `Ledger`): si scala il costo reale di ogni
risposta, calcolato da pi-ai, non il numero di messaggi. Prima del modello Jev (di
TypeSafe) classifica intento, peso e lingua in meno di un secondo: fuori tema e abuso si
fermano lì. Si ferma quando la probabilità di essere fuori tema (fuori tema più abuso) arriva a
0,65, o quella di abuso a 0,5: soglie fissate su 54 messaggi etichettati (`pnpm eval:jev`),
con 0 domande legittime fermate e 1 su 19 da fermare passata. Se Jev non risponde la
richiesta passa: il tetto in costo reale resta la garanzia.
Jev passa da OpenRouter con la stessa chiave del modello; TypeSafe diretto e Workers AI
restano come trasporti alternativi (`JEV_TRANSPORT` in `src/agent/site-agent.ts`).
Scartati: un numero fisso di messaggi per visitatore (rigido, ignora quanto costa una
domanda), il solo triage senza tetto (una classificazione si può ingannare).
Il budget per visitatore è di 10 centesimi al giorno (era 5: bastavano 3 domande con
`delegate`). In pagina si conta in crediti (1 credito = 0,01 centesimi, 1.000 al giorno)
e il contatore compare solo sotto il 30%: chi visita non deve sentirsi misurato. Token e
crediti di ogni risposta restano visibili, il costo in dollari nel tooltip.

## #13 - Tool sul codice dall'API di GitHub, pagine come schede

**Status:** attiva (Ciclo 15)

I tool sui repo leggono l'API REST di GitHub (`src/agent/github.ts`): nessun workspace da
tenere, chiamate da decine di millisecondi, solo lettura. Il repo è un parametro a valori
chiusi (i `repo` dei progetti pubblicati più quello del sito), e il codice lo ricontrolla
prima di chiamare GitHub. Il testo dei repo è dato, non istruzione: lo dice il prompt, e
i tool non hanno effetti da sfruttare. `GITHUB_TOKEN` è facoltativo: senza, 60 richieste
l'ora per IP e ricerca solo nei nomi dei file.
`show_page` mostra una scheda invece di aprire la pagina: il sito non ha un router lato
client, e navigare chiuderebbe la conversazione mentre l'agente risponde.
Scartati per ora: `@cloudflare/computer` (clona i repo, serve davvero solo per eseguire
codice: si rivaluta con `run_code`), `open_page` che naviga da solo.

## #14 - Tool dimostrativi: Code Mode in JavaScript, sotto-agenti di pi, invio solo umano

**Status:** attiva (Ciclo 16)

`render` riceve dati e mai HTML: la CSP blocca stili e script inline, e un HTML del
modello andrebbe sanificato. `run_code` usa il Code Mode di Cloudflare in JavaScript:
i Dynamic Workers accettano anche Python, ma Cloudflare stessa lo sconsiglia per codice
generato al volo (avvio nell'ordine dei secondi contro millisecondi), e il Code Mode
espone gli altri tool come API tipizzate solo in TypeScript. `delegate` segue lo schema
dei sotto-agenti del README di pi-durable (conversazioni possedute dalla chiamata), con
i soli tool di sola lettura. `draft_message` non spedisce: il modello scrive la bozza,
il visitatore la corregge e la manda dopo Turnstile, e il server accetta solo bozze nate
da una chiamata dell'agente nella stessa conversazione. Destinatario in un secret, perché
il repo è pubblico.
Scartati: Python per `run_code`, un invio deciso dal modello, un indirizzo di arrivo
scritto in `wrangler.jsonc`.
