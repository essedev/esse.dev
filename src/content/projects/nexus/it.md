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
---

Nexus è dove tengo task, progetti, note, libri, spese, riunioni e le mie conversazioni con Claude Code. Invece di un'app per ogni cosa c'è un solo motore: definisci uno schema e il sistema genera storage, API, i tool per l'assistente e un'interfaccia con tabelle, board, calendari e dashboard.

L'assistente non si limita a leggere i dati. Li gestisce mentre ci parlo, e fa evolvere lo schema: se gli dico che voglio tenere traccia dei film che guardo, crea il tipo, i campi e la vista. Ogni modifica è versionata e reversibile, e niente viene mai cancellato davvero.

- Automazioni a cron o a evento, compresi agenti che girano su un prompt.
- Trascrizione delle riunioni con i parlanti separati, OCR, ricerca web e vision come capability generiche.
- Un server MCP con OAuth, così qualunque coding agent può leggere e scrivere nei miei dati.
- Le chat di Claude Code sincronizzate dal laptop e collegate al progetto giusto: l'attività di un progetto la ricava da lì, non la scrivo a mano.

Backend Python con FastAPI, SQLAlchemy async e PostgreSQL con pgvector, frontend React. È self-hosted e single-user, con deploy blue-green. È la seconda versione: la prima era in Elixir e Phoenix.
