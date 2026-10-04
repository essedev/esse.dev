---
slug: "minerd"
title: "Minerd"
excerpt: "Un idle game di mining per mobile, già giocabile in singleplayer, come base per un'idea: un gioco che si aggiorna da solo con l'AI."
tags:
  - "TypeScript"
  - "Phaser"
  - "Fastify"
  - "PostgreSQL"
  - "Game"
---

Minerd è un idle game in cui costruisci e gestisci rig da mining: compri hardware, scegli cosa minare, tieni sotto controllo watt e temperature, e guadagni anche ad app chiusa. Ogni pezzo è unico, con una lotteria del silicio che ne cambia core, frequenze e consumi.

La base c'è: il singleplayer funziona, l'economia si bilancia con un comando e ci sono 412 test su tre livelli. TypeScript dappertutto, Phaser per il gioco, Fastify e PostgreSQL dietro. Il multiplayer, con il mercato e gli attacchi tra giocatori, è ancora un guscio.

## L'idea

Un idle game vive di contenuti nuovi: hardware, eventi, bilanciamenti. L'idea è che li produca un agente, dentro regole e test che decidono cosa può entrare, e che il gioco si aggiorni da solo mentre la gente ci gioca. Nel codice non c'è ancora niente di questo: per ora è la direzione.
