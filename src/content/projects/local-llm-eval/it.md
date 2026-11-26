---
slug: "local-llm-experiments"
title: "Local LLM Experiments"
excerpt: "Esperimenti con i modelli locali su un MacBook Pro M5 da 32 GB: quanto reggono come coding agent, quanto vanno veloci e come farli stare in memoria."
tags:
  - "LLM"
  - "MLX"
  - "Benchmark"
  - "AI Agents"
  - "Research"
  - "Python"
now: "Sto misurando quanto resta usabile il Mac mentre un modello grande gira dentro un tetto di RAM."
why: "Il perimetro di validità e quello che non ho misurato sono scritti prima dei risultati."
---

Da maggio 2026 uso il mio MacBook Pro M5 da 32 GB per capire cosa si può fare davvero con i modelli locali. Sono tre domande, arrivate una dopo l'altra.

## Reggono come coding agent?

Il task è sempre lo stesso: una piccola app con backend e frontend, generata da zero dentro un harness e valutata con una rubrica fissa. I primi round hanno lasciato due indicazioni, da prendere come tali:

- su un progetto piccolo un modello locale scelto bene sta alla pari con i modelli cloud;
- per il tool calling in locale servono tre cose allineate: il training del modello, il chat template e il parser del server. Se un anello è rotto, il modello fallisce appena installato.

Il resto l'ho archiviato. Il confronto fra dare il lavoro tutto insieme e spezzarlo in passi era sbilanciato, perché le due modalità ricevevano istruzioni diverse. Ho ricominciato con un metodo più stretto, e quel round è ancora da finire. Il perimetro è piccolo e il repo lo dice prima dei risultati: un solo task, quasi sempre una sola prova, niente refactor né contesti lunghi.

## Quanto vanno veloci?

Ad agosto ho misurato perché un modello più piccolo sul disco può essere molte volte più lento di uno più grande. Un modello denso rilegge tutti i suoi pesi a ogni token, uno MoE ne attiva solo una parte: sulla stessa macchina il primo faceva 8 token al secondo, gli altri due 40 e 60. Il limite è quanti GB al secondo la memoria riesce a muovere, non quanta RAM c'è.

## moe-stream

A novembre la domanda è diventata un'altra: far girare un modello grande senza che si prenda tutto il Mac. macOS non ha un modo di limitare la memoria di un processo, quindi il limite lo deve mettere il motore. moe-stream è un fork di llama.cpp per i modelli MoE: gli si dà un tetto di RAM, e i pesi che non ci stanno li legge dall'SSD quando servono.

Le misure sono del 23 novembre, sullo stesso Mac, e le rifaccio prima di pubblicare il repo:

- Il modello resta dentro la memoria che gli dai, e le risposte sono identiche, bit per bit, a quelle del modello tutto in memoria.
- Si paga in velocità: un modello da 16 GB fa 21-23 token al secondo tutto in memoria e 12-17 con un tetto di 12 GiB.
- Un modello da 102 GB gira sul Mac da 32 GB, a circa 7 token al secondo. Lì il limite è l'SSD.

Quello che non ho ancora misurato è la cosa per cui l'ho fatto: quanto resta usabile il Mac per il resto mentre il modello gira.

## LLM Dash

Per usarli ogni giorno c'è [LLM Dash](https://github.com/essedev/llm-dash), il pannello di controllo dei modelli locali sul mio Mac: i profili dei modelli in un file solo, il cambio da un modello all'altro dal browser, la memoria tenuta d'occhio (su 32 GB ci sta un modello grande alla volta) e una chat che mostra anche il ragionamento del modello. È open source con licenza MIT.
