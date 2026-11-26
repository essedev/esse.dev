---
slug: "piezo"
title: "piezo"
excerpt: "Un synth modulare che si suona nel browser e si costruisce insieme a un agente: i moduli si collegano con i cavi come su un hardware, e l'agente lavora sulla stessa patch che stai suonando."
why: "Il motore audio è uno solo, compilato in WebAssembly: gira nel browser quando suoni e sul server quando un agente chiede un render. Quello che l'agente ascolta esce dallo stesso motore che senti tu."
now: "È online sul mio server, con la registrazione chiusa; sto lavorando ai brani a tracce, che per ora gli agenti scrivono e renderizzano senza interfaccia."
---

piezo è un synth modulare che si suona nel browser. I moduli hanno nomi da oggetti (Pendolo, Cristallo, Prisma, Respiro) e si collegano con i cavi, come su un hardware. La parte che mi interessava di più è l'altra: un agente collegato al synth lavora sulla stessa patch che ho aperta, mentre suona.

## Come funziona

- Ogni cavo ha il colore del segnale che porta: audio, controllo o gate. Qualunque uscita può entrare in qualunque ingresso, e un cavo può finire anche su una manopola, per modularla.
- Il motore audio è scritto in C++ con i blocchi in Faust, compilato in un unico WebAssembly. Lo stesso file gira nel browser e nel backend.
- L'agente entra da un server MCP con OAuth. Ogni sua modifica compare sul canvas e si sente subito, si annulla con Cmd+Z come le mie e resta nella cronologia con il nome di chi l'ha fatta.
- Un momento è una patch suonata con una sequenza di note: si registra dalla pagina, si renderizza sul server e si giudica. Ogni render ha un'impronta audio, quindi i suoni si cercano per descrizione o per somiglianza; per ora lo fa solo l'agente.
- Si suona con la tastiera del computer, e una patch con un orologio dentro va avanti da sola.

## A che punto è

È nato il 16 novembre 2026 ed è online sul mio server, con la registrazione chiusa. Il rack regge patch generative grandi: ogni parametro si modula con un cavo, i cavi portano fino a 16 voci e l'uscita è stereo. Il prossimo pezzo sono i brani a tracce, che oggi gli agenti scrivono e renderizzano senza un'interfaccia.

Il codice per ora è privato. L'idea è aprirlo.
