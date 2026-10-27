---
slug: "watch-os"
title: "Watch OS"
excerpt: "Un firmware mio per uno smartwatch ESP32-S3: premi un tasto, parli, e risponde l'agente di Nexus."
tags:
  - "C++"
  - "ESP-IDF"
  - "ESP-Brookesia"
  - "ESP32"
  - "Embedded"
  - "Voice"
previously:
  - name: "Watch OS in C"
    year: 2026
    note: "La prima versione, in C su ESP-IDF: launcher, Wi-Fi, batteria, ora e impostazioni. Si era fermata prima dell'app vocale."
---

Uno smartwatch Waveshare con un ESP32-S3 e uno schermo AMOLED da 2 pollici. L'idea è un orologio che fa solo da interfaccia, microfono e altoparlante: trascrizione, modello, tool e voce stanno su [Nexus](/it/progetti/nexus), e il watch è un suo canale vocale.

Push-to-talk invece di una parola d'attivazione: meno batteria e nessuna attivazione per sbaglio. L'audio va e torna in Opus su un WebSocket, così la risposta può arrivare mentre il modello la sta ancora generando.

## Come è fatto

- Il firmware è ripartito da zero su ESP-Brookesia 0.8 di Espressif, che porta launcher multi-app, impostazioni, Wi-Fi e audio. La definizione della board l'ho scritta io: Brookesia non include questo modello.
- La UI ha un design system suo: testo su nero, perché sull'AMOLED il pixel nero è spento, linee sottili e un solo colore d'accento. Inter con le lettere accentate, densità 2,0 come gli smartwatch in commercio, e una schermata d'avvio col nome. Si cambia sovrascrivendo i file JSON di Brookesia, senza toccare il suo codice.
- Gli strumenti di sviluppo passano dalla USB: screenshot dei pixel mandati al pannello, tocchi simulati, carico della CPU e latenza del touch. Servono al coding agent per vedere e provare la UI senza che io tocchi l'orologio.

## A che punto è

La UI è pronta e va provata al polso. Poi viene l'energia (sospensione e risveglio dal tasto), poi la voce end-to-end con Nexus, poi gli aggiornamenti via Wi-Fi.
