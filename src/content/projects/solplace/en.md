---
slug: "solplace"
title: "SolPlace"
excerpt: "Interactive on-chain world map for placing Solana token logos, inspired by r/Place"
tags:
  - "Solana"
  - "Web3"
  - "MapLibre"
  - "Rust"
  - "Anchor"
  - "Crypto"
---

SolPlace is an interactive platform that overlays Solana token logos on a world map, inspired by Reddit r/Place and Wplace.live. Users connect their Solana wallet, navigate the map, select a grid cell and place a token logo by paying a SOL fee. Each cell can be overwritten, creating 'territory wars' between meme coin communities.

Fully on-chain for decentralization and transparency. Frontend with MapLibre and OpenStreetMap, backend with Solana programs (Anchor in Rust), real-time updates via websockets. Logos are automatically fetched from on-chain metadata. Business model: placement fees (0.001 SOL for free cells, 0.005 SOL for overwrites), split between burn and treasury.
