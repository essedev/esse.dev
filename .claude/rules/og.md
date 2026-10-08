---
paths:
  - 'src/pages/og/**'
  - 'src/lib/og.ts'
---

# Open Graph images

- OG: prerendered endpoint `src/pages/og/[name].png.ts` (satori + resvg), pure layout in
  `src/lib/og.ts` (terminal style, DECISIONS #19); the prerender runs in Node for resvg.
  Satori gotchas: `woff`/`ttf` fonts, never `woff2` (Departure Mono also has the `woff` in
  `src/assets/fonts/`); sizes in `style`; colors copied from `@theme`, because satori does
  not read CSS variables; a file is read from `process.cwd()`, not from `import.meta.url`,
  which at build points to `dist/`.
