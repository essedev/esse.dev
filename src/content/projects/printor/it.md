---
slug: "printor"
title: "printor"
excerpt: "Un laboratorio per capire se un LLM che legge le comunicazioni delle società quotate trova un segnale che il mercato non ha già prezzato, con un harness costruito per non ingannarmi."
tags:
  - "Python"
  - "LLM"
  - "Quant"
  - "DuckDB"
  - "Research"
why: "Il test che conta è sul cutoff del modello: sugli eventi successivi al suo addestramento il vantaggio sparisce, quindi buona parte del risultato era leakage."
---

La domanda è precisa: un LLM che legge gli 8-K, le comunicazioni che le società americane depositano quando succede qualcosa, trova un segnale che il mercato non ha già prezzato? Il modello legge e classifica, non predice prezzi.

La parte su cui ho messo più cura è l'harness. Ogni dato porta la data in cui era davvero disponibile, i costi si stimano titolo per titolo dallo spread invece che con una percentuale fissa, e ogni strategia si confronta con il buy and hold, con una baseline casuale e con uno Sharpe corretto per il numero di tentativi. Le ipotesi sono scritte prima di guardare i risultati.

## Cosa è uscito

- Su 9.304 eventi e 604 titoli il segnale sembrava battere il buy and hold: Sharpe 1,35 contro 0,86.
- Poi il test sul cutoff: sugli eventi sicuramente successivi all'addestramento del modello il vantaggio per evento scende a +15 punti base, con t=0,31. Non significativo. Buona parte del risultato era leakage: il modello conosceva già il seguito di quelle storie.
- Un secondo esperimento, sui cambiamenti di linguaggio tra un filing e l'altro, è nullo una volta tolto l'effetto del mercato. È costato zero, perché il test gratuito è venuto prima di quello a pagamento.

La conclusione è un risultato negativo, ed è il motivo per cui lo mostro: l'harness ha fatto quello per cui l'avevo costruito.
