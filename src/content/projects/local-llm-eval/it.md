---
slug: "local-llm-experiments"
title: "Local LLM Experiments"
excerpt: "Quanto regge il coding agentico con modelli locali su un MacBook Pro M5 da 32 GB, misurato contro i modelli cloud."
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

Volevo sapere se un modello locale può fare davvero da coding agent, non in una demo ma in un harness che scrive un'app intera. Il task è sempre lo stesso: una CRUD con backend FastAPI e SQLite e frontend React, generata da zero e valutata con una rubrica fissa.

- Su uno scaffold piccolo, Qwen3.6-35B-A3B quantizzato a 4 bit con MLX ha fatto 18 su 18 in 3,5-7 minuti, senza correzioni umane. Replicato due volte.
- Sullo stesso task Opus 4.7 ha fatto 17 su 18 a 0,76 dollari a run, DeepSeek V4 Flash 17 su 18 a 0,002: il costo cambia di circa 380 volte, il risultato resta nel rumore della rubrica.
- Per il tool calling in locale servono tre cose allineate: il training del modello, il chat template e il parser del server. Se un anello è rotto, il modello fallisce appena installato.
- Spezzare il lavoro in una roadmap salva i modelli fragili ma rompe quelli capaci, perché il reset del contesto fra un task e l'altro fa perdere coerenza.

Il perimetro è stretto e lo dico nel repo: un solo task, quasi tutte le celle con N=1, nessun dato su refactor o contesti lunghi. Vale come punto di partenza qualitativo, non come benchmark. Log, codice generato, punteggi e costi di ogni run sono pubblici.

## moe-stream

A novembre 2026 la domanda è diventata un'altra: far girare un modello grande senza che si prenda tutto il Mac. macOS non ha un modo di limitare la memoria di un processo, e llama.cpp con Metal blocca in memoria le pagine del modello. Il limite quindi lo deve mettere il motore. moe-stream è un fork di llama.cpp per i modelli MoE, quelli che per ogni token usano solo una parte dei loro pesi: gli si dà un tetto di RAM, e quello che non ci sta lo legge dall'SSD quando serve.

Misure del 23 novembre sullo stesso M5 da 32 GB, da rifare prima di pubblicare il repo:

- Il tetto regge: con 12 GiB il modello ne blocca 12,2, con 16 ne blocca 16,3.
- Token e probabilità sono identici bit per bit a quelli del modello tutto in memoria.
- Inkling 2 Mini, 16,5 GB su disco, fa 21-23 token al secondo tutto in memoria, 17,6-19,8 con un tetto di 16 GiB, 12-17 con 12 e 6-11 con 8.
- Qwen3.8 Flash Next, 102 GB su disco, gira sul Mac da 32 GB a circa 7,5 token al secondo con un tetto di 12-16 GiB. Lì il limite è la velocità dell'SSD.

Lo stesso tetto l'ho portato anche in un server basato su MLX. Quello che non ho ancora misurato è la cosa per cui l'ho fatto: quanto resta usabile il Mac per il resto mentre il modello gira. Il repo è ancora privato.

## LLM Dash

Per usarli ogni giorno c'è [LLM Dash](https://github.com/essedev/llm-dash), il pannello di controllo dei modelli locali sul mio Mac: quattro profili pronti (build, coder, plan e uno veloce per quando la memoria è stretta), avviati con `mlx_lm.server`, una dashboard per cambiare modello e tenere d'occhio memoria e velocità, e l'integrazione con opencode. Nei profili entrano solo modelli con il tool calling verificato davvero, con lo stesso harness degli esperimenti.
