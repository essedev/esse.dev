---
slug: "portsage"
title: "Portsage"
excerpt: "App per la barra dei menu di macOS che gestisce le porte dei progetti in sviluppo, con un server MCP e una CLI per gli agenti."
tags:
  - "Rust"
  - "Tauri"
  - "React"
  - "macOS"
  - "MCP"
  - "CLI"
---

Con quattro o cinque progetti aperti in parallelo, ognuno col suo Vite, il suo PostgreSQL e il suo Redis, le porte collidono di continuo. Portsage tiene il registro: quale porta è di chi, quali range sono liberi, quali processi girano senza appartenere a nessun progetto.

- Un popover nella barra dei menu per lo stato a colpo d'occhio, e una finestra per gestire progetti e impostazioni.
- Un server MCP: Claude Code, Cursor, Codex e gli altri agenti prenotano le porte e registrano i servizi da soli quando fanno lo scaffold di un progetto.
- Una CLI per gli script e il terminale, e una variante headless per Linux raggiungibile via SSH, con il port forwarding automatico.

Tauri 2 con backend in Rust e interfaccia React. È open source e si installa con Homebrew.
