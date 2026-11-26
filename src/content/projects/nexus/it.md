---
slug: "nexus"
title: "Nexus"
excerpt: "Piattaforma dati personale guidata da un assistente AI: ogni cosa è un'entità definita da uno schema, e aggiungere un tipo nuovo non richiede codice."
tags:
  - "Python"
  - "FastAPI"
  - "React"
  - "PostgreSQL"
  - "AI Agents"
  - "MCP"
why: "Ogni cosa è un'entità definita da uno schema, e un tipo nuovo non richiede codice. L'agente che opera ha privilegi minimi, quello che modifica il sistema lavora isolato e passa da un'approvazione umana."
previously:
  - name: "Plannerinator"
    year: 2024
    note: "Task, progetti, note e collezioni in SvelteKit, riscritto in Next.js un anno dopo con le sezioni salute e finanza prese da Life Terminal: il dominio che Nexus ha ereditato."
  - name: "Verbosa"
    year: 2025
    note: "Una chat multi-provider in Flutter e Go, con lo streaming e il modello scelto messaggio per messaggio: il mio primo client verso i modelli."
  - name: "NanoClaw"
    year: 2026
    note: "Un assistente su Telegram con il Claude Agent SDK, ogni gruppo isolato nel suo container."
  - name: "Life Terminal"
    year: 2026
    note: "Finanza e salute in un'app sola, con un agente che legge e scrive i dati e cambia ruolo a seconda della sezione. Finanza e salute sono passate in Plannerinator."
  - name: "Almanac"
    year: 2026
    note: "Un mio ChatGPT in Elixir e Phoenix, con tool, cartelle e RAG ibrido su pgvector."
  - name: "Nexus in Elixir"
    year: 2026
    note: "La prima versione di Nexus, in Elixir e Phoenix con LiveView: il runtime di Almanac con il dominio di Plannerinator."
  - name: "Bob"
    year: 2026
    note: "Un assistente vocale su Hermes Agent, con PWA e bot Discord: push-to-talk e voce in streaming. Fermato il giorno in cui è ripartito Nexus."
now: "È in produzione e lo uso ogni giorno; sta diventando multi-utente, con una seconda persona che vede e cambia solo quello che le è concesso. L'open source viene dopo."
---

Nexus è dove tengo task, progetti, note, spese, riunioni e le mie conversazioni con i coding agent. Invece di un'app per ogni cosa c'è un solo motore: definisci uno schema e il sistema genera storage, API, i tool per l'assistente e un'interfaccia con tabelle, board, calendari e dashboard.

L'assistente non si limita a leggere i dati. Li gestisce mentre ci parlo, e fa evolvere lo schema: se gli dico che voglio tenere traccia dei film che guardo, crea il tipo, i campi e la vista. Ogni modifica è versionata e reversibile, e niente viene mai cancellato davvero.

- Automazioni a orario o a evento, compresi agenti che partono da un prompt.
- Trascrizione delle riunioni, lettura di documenti e immagini e ricerca web, come capacità generiche che ogni tipo di dato può usare.
- Un server MCP, così qualunque coding agent può leggere e scrivere nei miei dati.
- Le chat con i coding agent e i commit dei progetti arrivano lì da soli, collegati al progetto giusto: l'attività di un progetto la ricavo da quello.
- Le modifiche delicate passano da una mia approvazione, e scelgo io quanto l'agente può fare da solo.

## A che punto è

È in produzione sul mio server e lo uso ogni giorno. È nato per una persona sola e sta diventando multi-utente: una seconda persona entra con il suo accesso, vede e modifica solo quello che le è concesso e ha un suo tetto di spesa. L'accesso c'è, manca la prova nell'uso di tutti i giorni. Dopo viene l'open source: il piano è scritto, il lavoro non è cominciato.

Backend Python con FastAPI e PostgreSQL, frontend React. È il punto d'arrivo di una serie di assistenti personali, uno diverso dall'altro: sono qui sotto, dal primo.
