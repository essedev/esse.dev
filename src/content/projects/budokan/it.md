---
slug: "budokan"
title: "Polisportiva Bu Do Kan"
excerpt: "Il sito della polisportiva Bu Do Kan: corsi, orari, istruttori e richiesta di una lezione di prova, con un pannello su misura da cui la palestra gestisce contenuti e richieste."
tags:
  - "Next.js"
  - "Cloudflare Workers"
  - "D1"
  - "CMS"
  - "CRM"
  - "Sport"
previously:
  - name: "Bu Do Kan su SvelteKit"
    year: 2024
    note: "La prima versione: SvelteKit su Cloudflare Pages, con Sanity come CMS headless. Nel 2026 il sito è passato a Next.js e i contenuti di Sanity sono migrati nel database del pannello."
---

Il sito della polisportiva Bu Do Kan: karate, danza, yoga, ginnastica. La palestra aggiorna da sola corsi, orari, staff, eventi e galleria da un pannello fatto su misura, e chi vuole provare una disciplina chiede una lezione gratuita direttamente dal sito.

## Il pannello

- Contenuti: corsi, sedi e orari, staff, blog, avvisi, eventi, galleria e la home con l'annuncio in evidenza. Ogni modifica ha la sua cronologia, e quello che si cancella passa dal cestino.
- Richieste: le prove e i contatti finiscono in un piccolo CRM, con stati, note, storico dei cambi ed export CSV. Chi telefona o passa in palestra si aggiunge a mano.

## Come è fatto

Next.js 16 su Cloudflare Workers con OpenNext, dati su D1 con Drizzle e media su R2. Le email partono da [Pigeon](/it/progetti/pigeon) e i moduli sono protetti da Turnstile. Ogni push su `main` applica le migrazioni, deploya e controlla le pagine pubbliche.
