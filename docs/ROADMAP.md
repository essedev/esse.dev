# Roadmap

Stato corrente del progetto. Milestone reali, non wishlist. Aggiornata insieme al codice.

Ultimo aggiornamento: 2026-09-22

## Contesto

`simonesalerno.it` è un portfolio personale (SvelteKit 2 + Svelte 5 + TS strict +
Tailwind 4) su Cloudflare Workers, con contenuti file-based JSON validati con Zod,
i18n hand-rolled (EN/IT) e immagini OG. È in produzione.

Chiuse e su `main`: M1-M10 (overhaul di qualità in 6 fasi, slug map derivata,
routing i18n unificato, rifiniture da review live, nuove funzionalità). La storia
sta in `docs/CYCLES.md` (Cicli 1-8), le decisioni durevoli in `docs/DECISIONS.md` e
`docs/ARCHITECTURE.md`.

## Milestone

### M11 - Restyle "Laboratorio" - In corso (branch `restyle/laboratory`)

Rebrand visivo verso un'identità "Laboratorio". Vision e decisioni in
`docs/RESTYLE.md`, log in `docs/CYCLES.md` (Ciclo 9, blocchi 1-4).

- Fatto sul branch: palette, tipografia, hero, navbar, card, filtri, footer, pagine
  interne, tema accento centralizzato + accent picker, telaio strumentale con nav
  unificata e header di sezione, ricurazione dei contenuti progetti, listing a due
  densità (vetrina + indice), articoli a indice, prima dose statica di CRT, favicon e
  manifest generati da un solo disegno.
- Su `main`: solo welcome AI-first e label dello status `idea` (pushati). La label è
  poi tornata "Idea" sul branch.
- Resta: animazioni come sistema coerente (M12).

### M12 - Motion come sistema - Da fare

Le animazioni custom dell'hero sono congelate: tararle una per volta alla cieca non
converge. Da rifare come sistema (registro fluido, easing che decelera), rispettando
il motion toggle e `prefers-reduced-motion`. Può chiudersi prima o dopo il merge.

### M13 - Merge del restyle su `main` - Da fare

- Giro completo `pnpm lint && pnpm check && pnpm build && pnpm test:ci`.
- Aggiornare gli E2E toccati dal restyle (voci nav, welcome, badge di stato, listing
  progetti non più paginato, articoli a indice).
- Merge su `main` e push: il deploy parte da Cloudflare Workers Builds.

## Stato deploy

M1-M10 e il riposizionamento del welcome sono su `main` e in produzione. Il resto di
M11 è sul branch `restyle/laboratory`, non mergiato.
