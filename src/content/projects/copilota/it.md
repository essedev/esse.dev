---
slug: "copilota"
title: "Copilota"
excerpt: "Un copilota per le call di vendita: app macOS in Swift che trascrive i due lati della call in tempo reale e propone le risposte dalla knowledge base in un overlay che vede solo chi vende."
tags:
  - "Swift"
  - "SwiftUI"
  - "macOS"
  - "FastAPI"
  - "RAG"
  - "Speech-to-text"
why: "Il backend vive dentro l'app: Postgres con pgvector compilato dai sorgenti, un Python portatile e il codice, tutto firmato. Chi la usa installa un'app, non un server, e lo stesso backend resta deployabile quando la knowledge base sarà del team."
previously:
  - name: "Sales AI Copilot"
    year: 2026
    note: "La prima versione, con l'overlay in Electron. Riscritta da capo in Swift dopo gli spike su trascrizione, modelli veloci e retrieval."
---

In una call di vendita le risposte servono nel momento in cui il cliente fa la domanda: prezzi, casi, obiezioni già sentite. Copilota ascolta la call e le porta in un overlay laterale, escluso dalla condivisione dello schermo e che non ruba il focus a Meet.

## Durante la call

- Due canali separati: il microfono è chi vende, l'audio di sistema è il cliente, catturato con un process tap di Core Audio. Ognuno ha il suo stream di trascrizione in tempo reale.
- Quando il cliente fa una domanda, solleva un'obiezione o tocca un tema della knowledge base, un modello veloce decide se serve una card e la scrive con la fonte: nel test dal vivo la card arriva in 1,1-1,3 secondi. Una card quando serve, non una per frase.
- Una domanda diretta (⌥⌘K) sulla knowledge base o sulla call stessa, come "cosa ha detto sul budget?", passa dalla stessa pipeline e risponde in meno di un secondo.
- In via sperimentale Nemotron separa le voci del cliente in locale, con MLX, in un processo isolato senza rete: sul campione di prova le frasi attribuite salgono da 22 a 28 su 37.
- Senza cuffie il microfono riprende il cliente dalle casse: un filtro dell'eco scarta quelle frasi prima che diventino contesto.

## Prima e dopo

Prima della call c'è una scheda del cliente costruita dalle call precedenti, dai documenti e da una ricerca web. Dopo arrivano la trascrizione completa con le voci separate, il riassunto, le obiezioni con la risposta data, le azioni e la bozza del follow-up. Nella finestra principale un agente risponde sulla knowledge base, sulle call e sul web, con le fonti citate.

## Sotto

- Ricerca ibrida, densa e lessicale con lo stemming italiano di Postgres, fusa con RRF: recall@5 di 0,97 sul corpus di prova.
- Il lavoro in background (ingestion dei documenti con OCR, embedding, schede, riassunti) passa da [pgbee](/it/progetti/pgbee).
- Le eval girano sul codice vero: controllano i fatti chiave delle risposte, i numeri inventati e il "non c'è" sulle domande fuori dalla knowledge base.
- Il client Swift è sottile: niente chiavi e nessuna chiamata ai provider, che stanno tutti nel backend.
