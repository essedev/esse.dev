---
slug: "watch-os"
title: "Watch OS"
excerpt: "Un firmware mio per uno smartwatch ESP32-S3: premi un tasto, parli, e risponde un agente che vive su un server."
tags:
  - "C"
  - "ESP-IDF"
  - "ESP32"
  - "Embedded"
  - "Voice"
---

Uno smartwatch con un ESP32-S3 e uno schermo AMOLED da 2 pollici, con un firmware scritto in C su ESP-IDF. L'idea è un orologio che fa solo da microfono e altoparlante per un agente: trascrizione, modello, tool e voce stanno tutti sul server.

Push-to-talk invece di una parola d'attivazione: meno batteria e nessuna attivazione per sbaglio. L'audio va e torna su un WebSocket full-duplex, così la risposta può arrivare mentre il modello la sta ancora generando.

Il firmware ha il launcher, il Wi-Fi, la gestione della batteria, l'ora sincronizzata e le impostazioni. Si è fermato prima del pezzo che conta, l'app vocale: i componenti per l'audio e il WebSocket ci sono, manca il collegamento.
