---
slug: "kols-tracker"
title: "KOLs Tracker"
excerpt: "Sistema di tracciamento acquisti KOL su pump.fun con alert real-time via Web UI e webhook Helius"
tags:
  - "Python"
  - "Flask"
  - "Solana"
  - "Helius"
  - "SQLite"
  - "Crypto"
  - "SSE"
---

KOLs Tracker monitora in tempo reale gli acquisti di 400+ wallet KOL (Key Opinion Leaders) su pump.fun. Quando più KOL comprano lo stesso token, il sistema genera alert istantanei via Server-Sent Events. Filtri configurabili per ATH (min/max) e soglia minima di KOL buyers permettono di identificare token promettenti.

Architettura: webhook Helius per transazioni Solana enhanced, Flask server con API REST, SQLite per storage persistente, backfill storico con tracking per-giorno. Web UI con dashboard alert, blockchain explorer, gestione KOL wallets. Latenza webhook ~1-5 secondi dalla transazione on-chain.
