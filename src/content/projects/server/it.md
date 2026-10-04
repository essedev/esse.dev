---
slug: "server"
title: "Server personali"
excerpt: "Due VPS per le mie app, uno che serve e uno che ogni notte prova a ripristinare i backup, con la conoscenza in un repo e un monitor che guarda tutto da fuori."
tags:
  - "Docker"
  - "Caddy"
  - "Cloudflare Workers"
  - "TypeScript"
  - "Ops"
why: "I controlli sanno cosa significa la risposta: l'endpoint MCP deve rispondere 401, perché un 200 vorrebbe dire che la protezione davanti è caduta."
---

Ad agosto 2026 ho spostato le mie app su due VPS: uno di produzione e uno che tiene i backup e ogni notte prova a ripristinarli. Quello che so su quei server sta in un repo di sola documentazione: inventario misurato, decisioni con il loro perché, la procedura per aggiungere un'app.

- Deploy da manifest: ogni app dichiara i file che servono sul server, e quello che non è nel manifest non arriva.
- Backup notturno su R2, con il ripristino verificato ogni notte sul secondo server.
- Nexus va in blue-green, senza interruzioni a ogni deploy.

## monitor

Un Worker Cloudflare guarda tutto da fuori, ogni 5 minuti, e vive fuori dall'infrastruttura che osserva. I controlli guardano il significato della risposta, non solo se arriva: `/ready` deve dire che il database è su, e l'endpoint MCP deve rispondere 401. Gli eventi sono transizioni di stato, non ripetizioni: un disco pieno fa un avviso, non 288 al giorno. Avvisi e comandi passano da Telegram, e se cade anche il monitor scatta un dead-man's switch esterno.
