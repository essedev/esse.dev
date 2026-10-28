---
slug: "architettura"
title: "Architettura prima del codice"
summary: "Dati, confini e standard si decidono prima della prima riga."
quote: "Un agente che sa dove sta lavorando sbaglia *molto meno*."
proofs:
  - project: "nexus"
    note: "Un solo motore: da uno schema escono storage, API, i tool dell'assistente e l'interfaccia."
  - project: "zeno"
    note: "Un motore in Astro e un solo Worker per tutti i siti: pubblicare vuol dire caricare un file."
  - url: "https://github.com/essedev/esse.dev/blob/main/docs/DECISIONS.md"
    title: "Questo sito"
    note: "Le decisioni numerate, con le alternative scartate, nel repo pubblico."
---

Dopo, l'esecuzione accelera, e un agente che sa dove sta lavorando sbaglia molto meno.

Per questo un progetto parte da un modello dei dati e da documenti che dicono dove finisce una parte e dove inizia l'altra. Il codice arriva dopo, ed è la parte che l'agente fa meglio di me.
