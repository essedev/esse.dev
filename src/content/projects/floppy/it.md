---
slug: "floppy"
title: "Floppy"
excerpt: "Un disco condiviso per chi monta video su Mac: nel Finder è un volume come gli altri, i file stanno su S3 e una cache locale rende veloci le clip già toccate."
why: "Su macOS JuiceFS richiederebbe l'estensione kernel di macFUSE, cioè avviare ogni Mac in recovery. Floppy lo fa girare in una piccola VM Linux e condivide il disco con il Mac via SMB: niente estensioni e niente permessi da amministratore."
now: "Un primo team lo usa da fine ottobre; sto lavorando su come si comporta con i file grandi nel lavoro vero."
---

Nasce dall'esigenza di un piccolo team che monta su Mac video girati quasi tutti da telefono, e vuole una cosa sola: un disco che compare nel Finder con i file sopra. Un disco di rete normale dal cloud non regge: una timeline legge pezzi sparsi di file grandi, e ogni lettura paga la distanza dal datacenter. I filesystem in streaming con cache locale risolvono, ma con un prezzo per persona. Floppy fa la stessa cosa con pezzi open source, sullo storage che scegli tu.

## Come funziona

- JuiceFS divide i file in blocchi su uno storage S3 e tiene in cache sul Mac quelli già letti.
- I metadati stanno in un database centrale, con una replica su ogni Mac. Ho scritto una patch a JuiceFS che legge dalla replica locale: l'elenco di una cartella da 300 file passa da 75 secondi a 0,3.
- Un'app nella barra dei menu fa il login, mostra i dischi del team e lo spazio sul Mac, e tiene attività e cestino: chi ha rinominato o cancellato cosa, e come tornare indietro.
- Un server self-hosted con un'interfaccia web per inviti e permessi per disco, e un server MCP con cui Claude gestisce il team e il Mac.

Nelle misure una clip mai aperta si legge circa cinque volte più in fretta di quanto serve per riprodurla. Non c'è un prezzo per persona: un team paga lo storage e un piccolo server per i metadati.

## A che punto è

L'app è su Homebrew e si aggiorna da sola. Un primo team la usa da fine ottobre 2026, su un'istanza self-hosted. Nelle prime settimane ha montato quasi sempre sul disco del Mac e portato su Floppy i risultati, perché i file grandi sembravano lenti: è il problema su cui sto lavorando, e le misure nel lavoro vero sono ancora da fare.

Il sito è [floppy.esse.dev](https://floppy.esse.dev). L'app è open source con licenza MIT, il server con licenza AGPL: `brew install --cask essedev/floppy/floppy`.
