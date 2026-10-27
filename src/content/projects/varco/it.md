---
slug: "varco"
title: "Varco"
excerpt: "Un navigatore per Milano che sa dove può entrare la tua auto: ZTL, aree pedonali, Area B e Area C in base al veicolo e all'orario, e un percorso che le evita."
tags:
  - "React"
  - "MapLibre"
  - "Cloudflare Workers"
  - "Hono"
  - "Python"
  - "Valhalla"
  - "PWA"
  - "Open Data"
why: "Nel dubbio una zona è vietata: una regola non trascritta, un orario non trovato o un calendario scaduto danno \"non puoi entrare\", mai \"libero\". L'unico errore che costa una multa è dire che si entra quando non si può."
previously:
  - name: "based-routing"
    year: 2026
    note: "Un trip planner per i mezzi che considera tutte le stazioni raggiungibili a piedi e sceglie quella che ti fa arrivare prima: orari di Trenord, ATM e due reti extraurbane, circa 5 milioni di passaggi, e i ritardi di Trenord in tempo reale. Una PWA con 176 test, ferma in attesa dei dati ufficiali."
  - name: "Milanoz"
    year: 2026
    note: "Una mappa degli 88 quartieri ufficiali di Milano con abitanti, redditi, prezzi delle case, verde e isole di calore, più i luoghi con la loro storia. Statica: una pipeline in Python prepara i dati, senza backend."
---

Da quando mi sono trasferito a Milano, nel 2026, la città mi ha dato tre progetti: Varco è il terzo, i primi due sono qui sotto. In auto la domanda non è solo come arrivo, ma se posso entrare: ZTL con orari diversi, aree pedonali, Area B e Area C con regole che dipendono da alimentazione, classe Euro e deroghe. Il navigatore ti porta dentro senza chiederti che auto guidi. Varco parte da lì: dice per ogni zona se puoi entrare, a quali condizioni e fino a quando, e ti guida evitando quelle vietate.

## Come funziona

- Il veicolo si descrive con i campi del libretto, più deroghe e permessi (residenza in Area C, Move-In, contrassegno disabili). Resta sul telefono, senza account.
- Il motore delle regole è TypeScript condiviso tra il Worker e la PWA: la risposta "posso entrare?" arriva anche senza rete.
- Ogni regola cita la fonte: gli atti del Comune, altrimenti il cartello visto su Street View con la data della foto. Le zone che mancano dal dataset del Comune le ho ridisegnate sulle vie di OpenStreetMap.
- Il percorso lo calcola Valhalla, la ricerca degli indirizzi Photon, entrambi self-hosted sul mio server. Se la destinazione è in una zona vietata, l'arrivo è il punto raggiungibile più vicino, verificato col router, e l'ultimo tratto è a piedi.
- Navigazione a voce, ricalcolo quando esci dal percorso, tappe, e per le auto elettriche le colonnine dalla Piattaforma Unica Nazionale.

## A che punto è

È online su [varco.esse.dev](https://varco.esse.dev), alla versione 1.1, e si installa dal browser come app. Tutte le ZTL in vigore sono trascritte con una fonte. Il prossimo passo è la prova in auto. Varco è un nome di lavoro.
