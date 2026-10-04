---
slug: "idkcraft"
title: "IDKCraft"
excerpt: "Un voxel game in stile Minecraft in Kotlin e OpenGL, con multiplayer, macchine e un aggiornamento dal vivo: 209 commit in due giorni. Più uno studio che genera le texture in pixel art."
tags:
  - "Kotlin"
  - "OpenGL"
  - "LWJGL"
  - "Game"
  - "Multiplayer"
  - "AI"
why: "Il gioco si aggiorna mentre ci giochi: il singleplayer è un client collegato a un server locale, quindi a ogni build il server riparte, ricarica il mondo e i client si aggiornano da soli."
---

IDKCraft è il test più spinto che ho fatto su quanto si può costruire in fretta con l'AI: 209 commit in due giorni, a marzo 2026, per un voxel game in Kotlin con LWJGL e OpenGL, giocabile e distribuibile come JAR.

## Cosa c'è

- Mondo infinito procedurale con 8 biomi, grotte, dungeon, luce del cielo e dei blocchi e ciclo giorno e notte.
- 84 blocchi e oggetti, 36 ricette, 7 mob con pathfinding A* e 7 macchine con una rete di energia e tubi, sul modello delle mod tecniche.
- Multiplayer con la fisica decisa dal server e la predizione sul client; il singleplayer è lo stesso codice con un server locale.
- Live update: modifico il codice, faccio la build, il gioco riparte da solo, ricarica il mondo e riprendo a giocare. In multiplayer si aggiornano tutti i client.
- 471 test.

## Le texture

I blocchi vanno disegnati. IDKCraft Studio è lo strumento accanto al gioco: genera texture in pixel art 16x16 con modelli di immagini, usando immagini di riferimento per tenere lo stesso stile, le riporta alla griglia e alla palette, e le mostra su un visore 3D dei blocchi prima di esportarle. C'è anche un editor per ritoccarle a mano. Il caricamento automatico nell'atlante del gioco è il passo che manca.
