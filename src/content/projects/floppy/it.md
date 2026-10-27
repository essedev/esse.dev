---
slug: "floppy"
title: "Floppy"
excerpt: "Un disco condiviso per chi monta video su Mac: nel Finder è un volume come gli altri, i file stanno su S3 e una cache locale rende veloci le clip già toccate."
tags:
  - "macOS"
  - "JuiceFS"
  - "Tauri"
  - "React"
  - "Python"
  - "FastAPI"
  - "Valkey"
  - "Homebrew"
why: "Su macOS JuiceFS chiederebbe l'estensione kernel di macFUSE, cioè avviare ogni Mac in recovery. Floppy lo fa girare in una piccola VM Linux e condivide il disco al Mac via SMB: niente estensioni e niente permessi da amministratore."
---

Nasce da un'esigenza di alcuni colleghi: montano video su Mac con CapCut, girato quasi tutto da telefono, e vogliono una cosa sola, un disco che compare nel Finder con i file sopra. Un disco di rete normale dal cloud non regge: una timeline legge pezzi sparsi di file grandi, e ogni lettura paga la distanza dal datacenter. I filesystem in streaming con cache locale risolvono, ma con un prezzo per persona. Floppy fa la stessa cosa con pezzi open source, sullo storage che scegli tu.

## Come funziona

- JuiceFS divide i file in blocchi su uno storage S3 (OVH a Milano nei test) e tiene in cache sul Mac quelli già letti.
- I metadati stanno in un Valkey centrale, con una replica nella VM di ogni Mac. Ho scritto una patch a JuiceFS che legge dalla replica locale e scrive in un solo round trip: l'elenco di una cartella da 300 file passa da 75 secondi a 0,3.
- Un'app nella barra dei menu, in Tauri, fa il login, mostra i dischi del team e lo spazio sul Mac, e tiene attività e cestino: chi ha rinominato o cancellato cosa, e come tornare indietro.
- Un control plane self-hosted con un'interfaccia web per inviti e permessi per disco, e un server MCP con cui Claude gestisce il team e il Mac.

Sulla prima istanza una clip mai aperta si legge a 41 MB/s, cinque volte quello che serve a un video a 61 Mbps, e un salto nella timeline costa 0,13 secondi in media. Non c'è un prezzo per persona: un team paga lo storage e un piccolo server per i metadati.

## A che punto è

L'app è su Homebrew e si aggiorna da sola, la versione per il team funziona end to end su uno stack locale e la prima istanza self-hosted è online. Il prossimo passo è il pilota col team. È open source con licenza MIT: `brew install --cask essedev/floppy/floppy`.
