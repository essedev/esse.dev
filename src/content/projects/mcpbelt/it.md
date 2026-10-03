---
slug: "mcpbelt"
title: "mcpbelt"
excerpt: "Un solo server MCP che dà a qualunque agente le capability che non può eseguire in locale: documenti, audio, pagine web, immagini."
tags:
  - "Python"
  - "FastAPI"
  - "MCP"
  - "AI Agents"
  - "OAuth"
  - "Astro"
---

Un coding agent sa scrivere codice, ma non sa leggere un PDF scansionato, trascrivere una registrazione o guardare un'immagine, a meno che qualcuno non gli colleghi un servizio per ciascuna cosa. mcpbelt le mette tutte dietro una connessione, un credito e uno schema.

Le singole capability sono commodity. Quello che conta è averle tutte in una connessione sola, scegliere fra fornitori diversi per costo e qualità, e tenere i risultati fuori dal contesto dell'agente: restano sul server e si interrogano quando servono.

- 459 token invece di 6.355 per un documento di quaranta pagine, che resta interamente interrogabile.
- Il primo giro a scala vera: 50 pagine e 56 minuti di registrazione consegnati in 35 secondi, per 1,14 euro pagati ai fornitori.
- Lo stesso giro ha trovato un difetto che nessun test poteva vedere: un OCR che valeva 200 millesimi ne incassava 84. Adesso le unità si contano dal file.

Backend FastAPI con OAuth 2.1 e una coda di lavori separata, sito pubblico in Astro, ricariche via Stripe.
