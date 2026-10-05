---
slug: "printor"
title: "printor"
excerpt: "Un laboratorio di ricerca quant su una domanda sola: dove un LLM dà un vantaggio vero nel trading, se lo dà. Con un harness costruito per non ingannarmi."
tags:
  - "Python"
  - "LLM"
  - "Quant"
  - "DuckDB"
  - "Research"
why: "Il test che conta è sul cutoff del modello: sugli eventi successivi al suo addestramento il vantaggio sparisce, quindi buona parte del risultato era leakage."
---

Un LLM non sa prevedere i prezzi, e i dati che hanno tutti sono già prezzati. Quello che sa fare meglio della media è leggere: trasformare testo che quasi nessuno legge davvero (filing alla SEC, trascrizioni delle call sugli utili, notizie, analisi nei forum) in un segnale strutturato e datato. printor è il laboratorio per capire se lì c'è un vantaggio, e dove.

Il modello ha due ruoli. Il primo è leggere ed estrarre il segnale. Il secondo è fare da critico: proporre ipotesi, scrivere i backtest, cercare i bias. Ma il rigore non lo dà la fiducia nel modello, lo impone l'harness: ogni dato porta la data in cui era davvero disponibile, i costi si stimano titolo per titolo dallo spread, ogni strategia si confronta con il buy and hold, con una baseline casuale e con uno Sharpe corretto per il numero di tentativi, e le ipotesi si scrivono prima di guardare i risultati.

## I primi due segnali

- Il tono degli 8-K, le comunicazioni che le società americane depositano quando succede qualcosa. Su 9.304 eventi e 604 titoli sembrava battere il buy and hold, Sharpe 1,35 contro 0,86. Sugli eventi sicuramente successivi all'addestramento del modello il vantaggio per evento scende a +15 punti base, con t=0,31: buona parte del risultato era leakage, il modello conosceva già il seguito di quelle storie.
- Come cambia il linguaggio da un filing all'altro: nullo una volta tolto l'effetto del mercato. È costato zero, perché il test gratuito è venuto prima di quello a pagamento.

Due risultati negativi, ed è il motivo per cui lo mostro: l'harness smonta i falsi positivi quasi gratis. La rotta da qui è aperta: mettere insieme più fonti per titolo (filing, acquisti degli insider, contratti pubblici), che è il gioco dove un LLM ha davvero un vantaggio, oppure provare il segnale in avanti, in paper trading.
