---
slug: "kols-tracker"
title: "KOLs Tracker"
excerpt: "KOL purchase tracking system on pump.fun with real-time alerts via Web UI and Helius webhooks"
tags:
  - "Python"
  - "Flask"
  - "Solana"
  - "Helius"
  - "SQLite"
  - "Crypto"
  - "SSE"
---

KOLs Tracker monitors in real-time purchases from 400+ KOL (Key Opinion Leaders) wallets on pump.fun. When multiple KOLs buy the same token, the system generates instant alerts via Server-Sent Events. Configurable filters for ATH (min/max) and minimum KOL buyers threshold help identify promising tokens.

Architecture: Helius webhook for enhanced Solana transactions, Flask server with REST API, SQLite for persistent storage, historical backfill with per-day tracking. Web UI with alert dashboard, blockchain explorer, KOL wallet management. Webhook latency ~1-5 seconds from on-chain transaction.
