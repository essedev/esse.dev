---
slug: "milano"
title: "Nuovo a Milano"
excerpt: "Da quando mi sono trasferito a Milano: un trip planner che sceglie la stazione giusta tra tutte quelle che hai intorno, e una mappa dei quartieri con i numeri."
tags:
  - "React"
  - "MapLibre"
  - "PostGIS"
  - "GTFS"
  - "Python"
  - "Open Data"
---

Mi sono trasferito a Milano nel 2026, e due progetti sono nati quasi subito.

## based-routing

A Milano la stessa destinazione si raggiunge da tante stazioni diverse, con arrivi molto diversi, ma Google Maps ti dà un itinerario per una coppia di punti. based-routing considera tutte le stazioni che raggiungi a piedi da dove sei e sceglie quella che ti fa arrivare prima.

- Importa gli orari di Trenord, ATM e di due reti extraurbane, circa 5 milioni di passaggi, e li aggiorna da solo quando cambiano.
- Calcola i tratti a piedi con OSRM e disegna i treni sul binario vero, con pgRouting sulla rete ferroviaria di OpenStreetMap.
- I ritardi di Trenord entrano in tempo reale, ogni 30 secondi.

È una PWA con 176 test. Il resto del tempo reale aspetta l'accesso ai dati ufficiali.

## Milanoz

Una mappa degli 88 quartieri ufficiali di Milano, cliccabili, con demografia, redditi, prezzi delle case, verde e isole di calore, più i luoghi con la loro storia. È statica: una pipeline in Python prepara i dati e il frontend li legge, senza un backend finché non serve. Ogni fonte tiene la sua licenza separata, così una si può togliere in blocco senza riscrivere niente.
