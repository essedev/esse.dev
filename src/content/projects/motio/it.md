---
slug: "motio"
title: "Motio"
excerpt: "Un framework open source per fare video scrivendo componenti React: ogni fotogramma viene reso in un vero Chrome headless e codificato con FFmpeg, con un'API compatibile con quella di Remotion."
why: "La compatibilità con Remotion la misuro: le funzioni pure devono dare gli stessi risultati del pacchetto pubblicato, e lo stesso fotogramma deve dare gli stessi pixel in qualsiasi ordine. Le soglie fanno parte del contratto: cambiarne una è una decisione scritta."
now: "È in pre-alpha e si prova da un clone; il prossimo passo è la pubblicazione su npm."
---

I video dei miei progetti li faccio con Motio: un video è un componente React, e il tempo è il numero del fotogramma. Motio rende l'albero React un fotogramma alla volta in un vero Chrome headless e lo codifica con FFmpeg. La sua API pubblica è compatibile con quella documentata di Remotion, quindi un progetto esistente si porta cambiando gli import. La licenza è Apache-2.0: nessun costo per render o per postazione.

## Come funziona

- Sono i pixel di Chrome: CSS e layout non vengono reimplementati. Se in Chrome si vede bene, il render è uguale.
- Il determinismo è verificato: stesso progetto, stesse props e stesso fotogramma danno gli stessi pixel in qualsiasi ordine, controllato sugli hash dei fotogrammi decodificati. È quello che permette di rendere i fotogrammi in parallelo, su più schede del browser.
- È pensato per essere usato da un agente: ogni comando ha l'output in JSON e gli errori hanno codici stabili. Ci sono still, contact sheet e controlli di sfarfallio, così chi scrive il video può anche guardare cosa è uscito.
- Il video di presentazione di Motio è fatto con Motio, musica compresa, sintetizzata dal codice. Anche il teaser di [Floppy](/it/progetti/floppy) nasce così.

## A che punto è

È nato il 22 novembre 2026 ed è in pre-alpha: su npm non c'è ancora niente e si prova da un clone del repo. In quattro giorni sono arrivati il render, la compatibilità con i pacchetti più usati, audio e video, il Player e la CLI, con ogni decisione scritta e le soglie di ogni traguardo nella roadmap. Adesso lo sto provando su progetti veri.

Nel benchmark del repo, sul mio Mac, le stesse composizioni escono da 1,2 a 3,7 volte più in fretta che con Remotion, secondo quante schede del browser lavorano in parallelo. Il metodo e lo script sono nel repo.

Sito e guida sono su [motio.esse.dev](https://motio.esse.dev). Motio è un progetto indipendente, non affiliato a Remotion.
