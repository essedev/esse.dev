---
slug: "media-hub"
title: "Media Hub"
excerpt: "La piattaforma del server di casa: una home con più app su un backend unico, un media server che fa partire il video mentre il file arriva e un'app per la TV Samsung."
tags:
  - "Python"
  - "FastAPI"
  - "React"
  - "Tizen"
  - "ffmpeg"
  - "Self-hosted"
why: "Il video parte mentre il file sta ancora arrivando: il motore prende i pezzi in ordine, dà la precedenza a quelli dove ti trovi, e ffmpeg li rimpacchetta al volo per il browser."
---

Il server di casa è un ThinkPad con Ubuntu. Media Hub è la piattaforma che ci gira sopra: una home da cui si aprono più app, su un backend unico. La prima è il media server, che ha preso il posto dello stack con CasaOS e Jellyfin.

- Il video parte subito, anche se il file non è ancora tutto sul disco: ffmpeg lo rimpacchetta al volo in fMP4 per il browser, e quando il file è completo si passa a leggerlo da lì.
- La libreria ha metadati, copertine, sottotitoli e voti, con le serie divise per stagione.
- Un'app per la TV Samsung, su Tizen e installata in sideload: home per categorie, dettaglio e player nativo. Il codice arriva dal server a ogni deploy, senza reinstallarla.
- Dal telefono funziona tutto nel browser.

Backend Python con FastAPI e PostgreSQL, frontend React, app TV in React sul player di Tizen.
