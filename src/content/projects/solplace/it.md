---
slug: "solplace"
title: "SolPlace"
excerpt: "Mappa mondiale interattiva on-chain dove piazzare loghi di token Solana, ispirato a r/Place"
tags:
  - "Solana"
  - "Web3"
  - "MapLibre"
  - "Rust"
  - "Anchor"
  - "Crypto"
---

SolPlace è una piattaforma interattiva che sovrappone loghi di token Solana su una mappa mondiale, ispirata a Reddit r/Place e Wplace.live. Gli utenti connettono il wallet Solana, navigano la mappa, selezionano una cella della griglia e piazzano il logo di un token pagando una fee in SOL. Ogni cella può essere sovrascritta, creando 'guerre territoriali' tra community di meme coin.

Completamente on-chain per decentralizzazione e trasparenza. Frontend con MapLibre e OpenStreetMap, backend con Solana programs (Anchor in Rust), aggiornamenti real-time via websockets. I loghi vengono fetchati automaticamente dai metadata on-chain. Business model: fee per placement (0.001 SOL celle libere, 0.005 SOL sovrascritture), split tra burn e treasury.
