---
slug: "misurare"
title: "Misurare invece di fidarsi"
summary: "Il codice generato sembra giusto anche quando non lo è."
quote: "Prima si misura, poi si decide cosa dire, e una conclusione sbagliata si *ritira per iscritto*."
proofs:
  - project: "darwin-chess"
    note: "Ogni modifica dell'agente resta solo se vince partite che lui non può toccare."
  - project: "local-llm-eval"
    note: "Un confronto sbilanciato archiviato e ricominciato da capo, con il perché scritto nel repo."
  - page: "agent"
    note: "Le domande di prova del filtro d'ingresso, e token e costo di ogni risposta a schermo."
---

Prima si misura, poi si decide cosa dire, e una conclusione sbagliata si ritira per iscritto.

Con gli agenti che scrivono in pochi secondi, il lavoro si sposta sulla verifica: un agente va veloce quanto l'ambiente che lo controlla, e mi fido di lui quanto mi fido di quell'ambiente. Per questo lo costruisco prima, e fuori dalla sua portata.

Si misura con test, review e numeri veri, e nei miei progetti accanto ai risultati scrivo cosa ho misurato e cosa no.
