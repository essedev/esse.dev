---
slug: "darwin-chess"
title: "darwin-chess"
excerpt: "Un agente LLM da pochi centesimi scrive un motore di scacchi in Rust partendo da un progetto vuoto e lo fa evolvere da solo: una modifica resta solo se batte la versione precedente in partite vere."
tags:
  - "AI Agents"
  - "Rust"
  - "Chess"
  - "Research"
  - "Python"
  - "FastAPI"
  - "React"
  - "Docker"
why: "L'agente controlla tutto il motore e non ha nessun accesso all'ambiente che lo verifica: non può vederlo né toccarlo. Anche il controllo delle mosse legali usa posizioni casuali, perché i conteggi di quelle standard sono noti e si potrebbero scrivere a mano."
now: "Gira giorno e notte dal 25 novembre ed è alla quindicesima generazione; sto misurando quanto rende farlo ragionare di più a ogni sessione."
---

Volevo vedere fin dove arriva un agente economico lasciato da solo, a patto che non possa barare sulla misura. Gli scacchi sono l'ambiente ideale: il verdetto è una partita, costa poco e nessuno lo può discutere. Così ho dato a Claude Haiku un progetto Rust vuoto e una regola sola: una modifica sopravvive se batte la versione precedente.

## Come funziona

- Il motore è dell'agente: lo scrive, lo cambia e propone le modifiche. Ogni proposta accettata è una generazione, e ogni generazione è un commit.
- L'ambiente di verifica sta fuori dalla sua portata. Una proposta deve compilare, generare le mosse giuste su posizioni casuali, reggere qualche partita di prova e poi vincere un match contro il campione in carica, chiuso da un test statistico e non a occhio. Ogni motore gioca nel suo container, senza rete.
- Ogni nuovo campione affronta Stockfish a forza limitata su una scala di livelli. Ne esce un Elo con il suo margine di errore.
- Ogni sessione parte da un contesto nuovo: quello che l'agente sa sta nella storia del codice e nel registro degli esperimenti. Ogni dieci tentativi rilegge tutto e riscrive la propria strategia.
- Su Lichess un bot gioca con il campione in carica, quando Lichess glielo lascia fare. Lì non si giudica niente: le sconfitte tornano all'agente come lezioni, analizzate da Stockfish.

## Cosa è successo finora

I numeri sono del 26 novembre, dopo un giorno e mezzo. Quelli aggiornati sono in diretta su [darwin.esse.dev](https://darwin.esse.dev), insieme alle partite, al ragionamento dell'agente e alla spesa.

- Meno della metà delle proposte sopravvive. Le altre perdono il match, non passano i controlli o partono da una base già superata.
- L'Elo contro Stockfish è passato da circa 1.200 a circa 2.000. Per un motore di scacchi è poco: per ora guardo la pendenza.
- Una sessione costa poco più di un centesimo. A fare la coda è la CPU che gioca le partite, non il modello.
- Per quattro generazioni l'agente ha solo ritoccato la valutazione, guadagnando poco. Doveva rileggere la propria storia ogni dieci tentativi e non l'aveva mai fatto, per un bug mio. Corretto quello, alla prima riflessione vera ha cambiato strada e ha fatto il salto più grande fin lì. Nello stesso giro l'ho anche fatto ragionare di più a ogni sessione, quindi non so dire quale delle due cose abbia pesato.

Un limite va detto subito: l'agente conosce a memoria le tecniche dei motori di scacchi e le sta applicando più o meno nell'ordine dei manuali. Finora quindi misuro quanto bene applica cose note sotto una verifica che non può piegare, non una scoperta. Il piano è che la conoscenza scacchistica arrivi da una rete addestrata sulle partite del motore contro se stesso, invece che dalla memoria del modello.

Gira su un MacBook Air M4 senza ventola, in casa. Il codice è open source con licenza MIT.
