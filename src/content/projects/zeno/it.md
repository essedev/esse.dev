---
slug: "zeno"
title: "Zeno"
excerpt: "Un'agenzia web fatta di agenti per le attività locali italiane: trova chi non ha un sito, gliene costruisce una demo vera e segue vendita, pubblicazione e supporto."
tags:
  - "AI Agents"
  - "Astro"
  - "Cloudflare Workers"
  - "Python"
  - "FastAPI"
why: "Ogni contenuto dichiara nello schema da dove viene: dati camerali, dedotto, contenuto d'esempio o cliente. In sviluppo gli esempi si vedono, in produzione fanno fallire la build: un sito non può andare online con un testo inventato."
---

Tante attività locali non hanno un sito, o ne hanno uno rotto. Zeno è un sistema di agenti che le trova, genera una demo del loro sito con i loro dati e, se il titolare la approva, segue il resto: pagamento, pubblicazione, hosting, modifiche e supporto. La demo è la proposta. Zeno dichiara sempre di essere automatico; io sono il garante e intervengo solo su chiusure, approvazioni e blocchi.

## A che punto è

Ci sono il motore dei siti, tre demo complete della stessa impresa di prova, il sito di Zeno e una simulazione dell'area cliente che percorre tutto il giro: richiesta, chiarimento, anteprima, revisione, approvazione. La conversazione con un modello vero, il portale e l'automazione del servizio sono la prossima milestone.

## Come è fatto

- Un sito è una cartella composta da dati camerali, zone dedotte e un pacchetto di contenuti per settore; `pnpm zeno new` ne crea uno da un record camerale.
- Il motore è uno solo, in Astro: stessi componenti, dati diversi per ogni sito.
- Tutti i siti li serve un solo Worker Cloudflare, che risolve l'hostname e legge l'artefatto da R2. Pubblicare vuol dire caricare un file e aggiornare una mappa, senza un progetto per cliente.
