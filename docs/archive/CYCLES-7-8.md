# Cycles 7-8 (archivio)

Cicli archiviati da `docs/CYCLES.md`, numerazione intatta. I precedenti in
`CYCLES-1-6.md`.

---

## Ciclo 7 - Vetrina home: progetti featured (2026-06-02)

### Obiettivo

La home mostrava i 6 progetti piu recenti. Renderla una vetrina curata: scegliere
quali progetti mettere in evidenza, e in che ordine.

### Lavoro

- `3e930ad` feat(home): vetrina di progetti featured. `config/featured.json`
  elenca fino a 6 id progetto in ordine; la home li mette davanti e riempie gli
  slot restanti con i piu recenti non-featured (cap 6 responsivo applicato da
  `ProjectsSection`). Pezzi: schema Zod + tipo `FeaturedConfig`, branch nel
  `loadConfig`, validazione a build (id esistenti, max 6) in `validate-content`,
  util puro `orderFeaturedFirst` (testato), `+page.server` della home che applica
  l'ordinamento. La listing `/[lang]/[route]` non passa di qui.

### Decisioni / note

- Selezione + ordine in un file config (non un flag `featured` nei meta ne un
  `featured_rank`): l'ordine della vetrina e esplicito e in un solo posto,
  disaccoppiato dal contenuto, riordinabile spostando una riga, validabile a
  build. Il boolean non da l'ordine; il rank sparso sui meta e piu fragile.
- Featured solo in home: la listing resta neutra (per data, con filtri/sort), per
  non creare conflitti tra "featured in cima" e l'ordinamento/i filtri scelti
  dall'utente. "Featured" = vetrina della home, non del catalogo.
- `config/featured.json` parte con `["budokan", "core", "horizon"]` come esempio:
  va curato (sono solo un placeholder funzionante).

### Verifiche

- `pnpm check`: 0 errori; `pnpm lint`: pulito
- `pnpm test:ci`: 166 unit verdi (+5 `featured`), 32 E2E verdi (+1 home featured)
- `pnpm build`: OK end-to-end; `validate-content` verde

---

## Ciclo 8 - Link esterno progetto apre in nuova scheda (2026-06-02)

### Obiettivo

Il link al sito del progetto, nella pagina di dettaglio, non apriva in nuova
scheda (mancava `target="_blank"`), a differenza dei link in Contact e Footer.

### Lavoro

- `fix(projects)`: aggiunto `target="_blank"` + `rel="noopener noreferrer"` al
  link esterno in `Project.svelte`, allineandolo agli altri link esterni del sito.
