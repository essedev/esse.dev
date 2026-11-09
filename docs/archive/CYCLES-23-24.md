# Cycles 23-24 (archive)

Cycles archived from `docs/CYCLES.md`, numbering intact. The earlier ones in
`CYCLES-1-6.md`, `CYCLES-7-8.md`, `CYCLES-9-10.md`, `CYCLES-11-12.md`, `CYCLES-13-14.md`,
`CYCLES-15-16.md`, `CYCLES-17-18.md`, `CYCLES-19-20.md` and `CYCLES-21-22.md`.

---

## Cycle 23 - Public repo, production, covers and logos (2026-10-05)

From the public repo to production, then the M16 covers (`2f6abed` .. `e96fe80`).

- **Public repo:** renamed `essedev/esse.dev` (Worker and package stay `simonesalerno`);
  MIT for the code, content and visual identity excluded at the top of `LICENSE`. Docs,
  comments and test names in English, README mirrored in `README.it.md`,
  `docs/CONVENTIONS.md` with language and glossary; `pnpm lint` runs
  `scripts/check-prose.py` and requires doc comments on the exports of `src/lib` and
  `src/agent`. `eslint-plugin-jsdoc` stays at 61: 65 needs Node 22.22.2 or 24.15, and with
  `engine-strict` an older Node 22 would fail the install.
- **Reserved content** (`49c2e71`): unpublished projects, two archived mockups with
  internal material and the personal notes leave the working tree (#21 supersedes #6).
- **Production:** `astro` reaches `main`, the restyle and `astro` branches go to a bundle
  outside the repo; the pixel-art PNGs left the unpushed history, so the commits cited in
  these cycles were remapped. First Astro deploy from `main` with Workers Builds.
- **Finishing touches:** `/llms.txt` built from the collections (before it fell into the
  catch-all redirect); profile links with a 24 px touch target (flagged by Lighthouse);
  the pane on the same glass as the list, which read as a greyer material.
- **Covers and logos (#22):** `scripts/render-cover.ts` (mockup from a JSON spec) and
  `scripts/render-logo.ts` (tile with a Lucide glyph or the project's own mark). Every
  project page opens with a cover, the logo rises over its edge and takes the LED's place
  in the list. Screenshots from demo data where an interface exists, designed mockups for
  the five with nothing to show. Short rounds after: every logo a tile, the shadow follows
  the logo's shape, no text in a designed cover (it repeated the heading and stayed in
  English on the Italian pages), Budokan's cover tried on four sections of its site.
- **Content:** the Nexus lineage from Plannerinator and Life Terminal to Elixir; Ethicode no
  longer links to a domain now serving another product.
- **Next step:** rereading the M16 entries with Simone, a skill that proposes the items.

## Cycle 24 - Analytics, privacy notice, conversations that expire (2026-10-06)

Mobile fixes, then what the site collects and for how long (`fa4e6a6` .. `7ce1c79`).

- **Mobile:** pager links side by side with titles on two lines; pane and drawer rounder
  and closer to the screen corners.
- **Analytics:** `essedev.it` expired, so Umami moves to `analytics.esse.dev`, self-hosted,
  with neutral names for script and collect endpoint (the defaults are in the ad blockers'
  lists); the CSP changes in the same commit, or the browser blocks the script silently.
  Custom events in `src/scripts/track.ts`: where an agent message comes from, notices,
  errors, drafts sent, copies, the host of an outbound link. Never the visitor's text.
- **Retention (#23):** a conversation expires 90 days after the last message
  (`src/agent/retention.ts`). A Lifecycle job moved on every settled turn empties the
  object: alarms off, storage deleted, instance reset. Conversations from before get a
  deadline at their next start. "Nuova conversazione" does not delete.
- **Privacy notice (#23):** a single page in both languages, linked from the list's status
  line and under the agent's field, in the sitemap, `llms.txt` and the agent's index, so
  the agent answers "do you keep my messages?" from the notice. Then a summary on top and
  categories instead of model, providers, server location and storage keys.
- **Content:** Budokan is the Next.js rewrite, the SvelteKit site goes to `previously`.
- **Next step:** the Open items of the ROADMAP (redirect from `simonesalerno.it`, the
  `hello@esse.dev` mailbox) and the production secrets for `draft_message`.
