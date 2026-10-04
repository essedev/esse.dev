---
slug: "solana"
title: "Esperimenti su Solana"
excerpt: "Una mappa del mondo on-chain dove i token si contendono il territorio, e intorno gli strumenti che ho scritto per leggere il mercato di Solana in tempo reale."
tags:
  - "Solana"
  - "Rust"
  - "Anchor"
  - "TypeScript"
  - "Python"
  - "Web3"
---

Tra l'estate 2025 e l'inizio del 2026 ho lavorato dentro l'ecosistema di Solana, quello dei launchpad e dei token che nascono e muoiono in un pomeriggio. Il progetto da mostrare è SolPlace; intorno ci sono gli strumenti che ho costruito per capire come funziona quel mercato.

## SolPlace

r/Place, ma per i token di Solana su una mappa vera del mondo. Ogni comunità pianta la bandiera del suo token in un punto, e chi vuole quel posto lo paga di più: il prezzo sale a ogni sovrascrittura. Ogni posizionamento è una transazione on-chain, con un programma in Rust e Anchor e nessun database dietro. È rimasto un prototipo.

## Gli strumenti

- Lettura in tempo reale delle transazioni dei launchpad dagli stream dei blocchi, distinguendo acquisti, vendite e swap nelle due fasi di vita di un token: la bonding curve e poi l'AMM.
- Un tracker che segue i portafogli di chi muove il mercato e avvisa quando più di loro comprano lo stesso token, incrociando tre API per capire su quale piattaforma è nato.
- Un archivio di token con il monitoraggio degli account su X, i media scaricati e lo storico dei profili.
