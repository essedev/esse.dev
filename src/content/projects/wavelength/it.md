---
slug: "wavelength"
title: "Wavelength"
excerpt: "Una radio fatta dall'AI, nata a un hackathon della Milan AI Week 2026: una redazione di agenti sceglie e verifica le notizie, due conduttori AI ne parlano in diretta."
tags:
  - "AI Agents"
  - "Python"
  - "FastAPI"
  - "PostgreSQL"
  - "React"
  - "Hackathon"
---

L'ho costruita in tre giorni per l'AI Agent Olympics della Milan AI Week 2026. Una redazione di agenti legge le fonti, sceglie le notizie, le verifica e le scrive; due conduttori AI ne parlano in un dialogo a più turni, generato e letto in streaming.

## Come è fatta

- Gli agenti non si parlano mai direttamente: scrivono e leggono da un registro di eventi append-only in Postgres, svegliati con LISTEN/NOTIFY, e ogni messaggio è validato da uno schema.
- La fiducia cresce lungo la catena: chi valida le fonti, chi fa ricerca, un gruppo di critici. Chi viene dopo non rifà il lavoro di chi c'era prima.
- Il dialogo è pensato per non avere pause: mentre un conduttore parla, la battuta dell'altro è già in preparazione.

In tre giorni sono arrivati la redazione con il suo registro di eventi, l'intake delle fonti e lo studio nell'interfaccia; il resto della catena è rimasto nel design quando è finito l'hackathon.
