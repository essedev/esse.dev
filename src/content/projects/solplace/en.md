---
slug: "solana"
title: "Solana experiments"
excerpt: "An on-chain world map where tokens fight over territory, and around it the tools I wrote to read the Solana market in real time."
tags:
  - "Solana"
  - "Rust"
  - "Anchor"
  - "TypeScript"
  - "Python"
  - "Web3"
---

Between summer 2025 and early 2026 I worked inside the Solana ecosystem, the one of launchpads and tokens that are born and die in an afternoon. The project to show is SolPlace; around it are the tools I built to understand how that market works.

## SolPlace

r/Place, but for Solana tokens on a real world map. Each community plants its token's flag somewhere, and whoever wants that spot pays more for it: the price goes up with every overwrite. Every placement is an on-chain transaction, with a program in Rust and Anchor and no database behind it. It stayed a prototype.

## The tools

- Real-time reading of launchpad transactions from block streams, telling buys, sells and swaps apart in both phases of a token's life: the bonding curve and then the AMM.
- A tracker that follows the wallets of the people who move the market and alerts when several of them buy the same token, crossing three APIs to tell which platform it was launched on.
- A token archive with monitoring of X accounts, downloaded media and profile history.
