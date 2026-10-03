---
slug: "flux"
title: "Flux"
excerpt: "Lettore di newsletter e feed RSS che estrae gli articoli in markdown pulito e fedele all'originale, tutto su un solo Worker Cloudflare."
tags:
  - "Cloudflare Workers"
  - "Hono"
  - "D1"
  - "React"
  - "PWA"
  - "AI"
---

Flux è nato come TLDR Checker, uno scraper per leggere i digest di TLDR senza aprire la mail. La seconda versione è diventata un lettore agnostico: qualunque feed, qualunque newsletter, con gli articoli ben separati e il contenuto fedele all'originale.

L'estrazione usa ricette generate da un LLM per ogni fonte, ma il modello non riscrive mai il testo: individua dove sta il contenuto, e il contenuto viene copiato così com'è. È la regola che tiene lontane le allucinazioni e fa sì che non si perda niente.

- Un cron cattura i feed e salva subito l'originale, poi una coda di Cloudflare Queues fa l'estrazione: se qualcosa fallisce, il dato grezzo c'è già.
- PWA con lettura offline, salvati, collezioni, ricerca e notifiche push con un digest due volte al giorno.
- Worker in Hono, D1 con Drizzle, better-auth; frontend React 19 con Tailwind e shadcn/ui.

È in produzione dal 6 giugno 2026. La prima versione, uno scraper Node con PocketBase e React, è conservata in un branch.
