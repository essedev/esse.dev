---
slug: "witf"
title: "What's in the Fridge"
excerpt: "Applicazione web per la gestione intelligente dell'inventario domestico con blog ricette AI e riduzione spreco alimentare"
tags:
  - "Next.js"
  - "TypeScript"
  - "Cloudflare"
  - "PostgreSQL"
  - "Drizzle"
  - "AI"
  - "OpenAI"
---

What's in the Fridge (WITF) è un'applicazione web per la gestione intelligente dell'inventario domestico. Traccia prodotti con sistema batch per scadenze multiple, organizzazione per location (frigo, freezer, dispensa), alert scadenze con notifiche visive e sistema memoria per prodotti frequenti. Include calendario raccolta differenziata configurabile e upload immagini prodotti.

Feature distintiva: blog AI automatico che genera ricette basate sull'inventario e articoli su cibo stagionale, con scheduling pubblicazioni via Cloudflare Cron. Stack: Next.js 15, React 19, TypeScript, Tailwind CSS 4, shadcn/ui, Drizzle ORM con PostgreSQL Neon, Better Auth per autenticazione RBAC, OpenAI API per generazione contenuti, Cloudflare R2 per storage e Workers per deploy edge.
