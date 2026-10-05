# Roadmap

Current state of the project. Real milestones, not a wishlist. Updated together with the code.

Last update: 2026-10-05 (Cycle 22: icons in motion, content, agent in dev)

## Context

In production on `main` is the SvelteKit site (M1-M10, history in `docs/CYCLES.md`).
The "Laboratorio" restyle (M11) is paused and stays intact on the `restyle/laboratory`
branch: the pieces worth keeping are picked from there (motifs in
`docs/archive/RESTYLE.md`). Work restarts on the `astro` branch, created from
`restyle/base` (the look of `main` plus the new content), with four milestones in
sequence: first the platform, then the style, then the projects, finally the agent. Going
online waits until the site is complete (Simone's choice): everything goes in first.

## Milestones

### M14 - Migration to Astro - Done on the `astro` branch, to be put online

Site rebuilt in Astro with a neutral starting look (Simone's choice: a canvas to start
from instead of parity with the base look). Log in `docs/CYCLES.md` (Cycle 11), choices
in `docs/DECISIONS.md` #10. Gate green: lint, check, build, unit, E2E.

- To go online: check in the Cloudflare Workers Builds settings that the build command
  is `pnpm build`, the deploy `npx wrangler deploy` and Node at least 22.12; upload the
  secret `OPENROUTER_API_KEY` (`wrangler secret put`), without which the agent does not
  answer, and `GITHUB_TOKEN` (fine-grained, read-only on public repos), without which the
  code tools get 60 requests an hour per shared IP; for `draft_message`: Email Routing
  active on `esse.dev` with the destination address verified, the secrets `MAIL_TO` and
  `TURNSTILE_SECRET` and the build variable `PUBLIC_TURNSTILE_SITE_KEY` of a real
  Turnstile widget (without it, the test key that always passes applies); then merge to
  `main` with squash (see Open) and push.

### M15 - Structure and style - Done

Chosen structure: the site as a workspace (concept A, Cycle 12), ported to Astro. Done:
two columns as tall as the window (list and pane with toolbar), the level above in the
toolbar and not in the content, the pager at the bottom of the pane with h/l, the list in
order of importance with only the project showcase. Style from concept B (Cycle 17, per
DECISIONS #15): lavender and green for live states, Departure Mono, CRT veil, window with
two cards on a wide screen; slimmer home with the agent first. On mobile the window with
the pane and the list in a drawer (Cycle 18), finishing touches closed in Cycle 19. The
glass window on a colored background (Cycle 19, per DECISIONS #16). OG in the terminal
style and favicon with the logo cursor, from concept D (Cycle 20, per DECISIONS #19).
Closed by Simone in Cycle 20; the height of the list is among the Open items.

### M16 - Projects - In progress

Principles, voice and sorting in `docs/features/progetti.md`.

- Done (Cycle 21): census of the repos and sorting with Simone (showcase, registry,
  families, ideas, out), applied to the entries. Client work stays out by default; a
  private repo is published only item by item.
- Done (Cycle 21): `previously` field, the earlier iterations of an idea as data (per
  DECISIONS #20); `maintained` status for finished tools still in use.
- Done (Cycle 21): first drafts of the new entries from the repo analysis.
- To do: rereading the entries with Simone. Facts (dates, activity, stack) come from the
  sources, the text is written by hand, including the "Why" box.
- To do: a cover for every project from a component (color, Lucide icon or SVG, UI scene),
  real screenshots where they exist. Tags cleaned up.
- To do: a skill that proposes the new or updated items from the repos; it proposes, it
  does not publish.

### M17 - Agent - In progress

A page of the site (`/it/agente`, one row in the list) is a real agent, with tools, that
shows how it works: every tool call, model, tokens and cost per answer. It takes the place
of the earlier idea (the site redesigned live by a model). Choices in
`docs/DECISIONS.md` #11-#14.

- Done (Cycle 14): a Durable Object per visitor with pi-durable, `glm-5.3-flash` from
  OpenRouter, `search_site` and `read_page`, triage with Jev evaluated on a labeled set,
  limit in real cost per visitor and for the site, transcript with tokens and cost.
- Done (Cycle 15): `list_projects`, `show_page` (card to open) and the tools on public
  repos via the GitHub API (#13). The site repo is read from the `main` branch: until the
  merge the agent sees the old site.
- Done (Cycle 16): the demo tools, one per capability, with the limits in code: `render`
  (bars, tables, timelines), `run_code` (Code Mode in a Dynamic Worker), `delegate` (2-3
  pi-durable sub-agents), `draft_message` (a draft the visitor sends, after Turnstile).
  Choices in #14.
- Done (Cycle 19): chat goes to the model, which answers briefly and without tools (#12);
  per-IP limits, burst of 10 messages a minute and 50 cents a day (#17); red team: 10
  attacks in Jev's set, passed live too. No allowlist of external links until
  conversations are shareable (#18).
- Read-only tools on already public data. No writes, no fetch of arbitrary URLs, no
  private repos, no memory between visits. The only effect outside the site is the
  `draft_message` email, and it goes out only from a visitor's click.
- To do: the sub-agents' events live in the page (today they show once the work is
  done); `@cloudflare/computer` only if running the repos' code became necessary.
- To measure with real traffic: whether the weight estimated by Jev predicts the real
  cost of the answers (both exist for every message). Only if it predicts it well, use it
  to choose which tools to offer; today the weight is shown and that is all.
- Before enabling it in production: cost measured on a sample and approved by Simone.
  Measures in preview: a simple question 0.05-0.1 cents, one with `run_code` about 0.15,
  one with `delegate` about 0.9 with the per-child cap (it was 1.4; budget of 10 cents a
  day per visitor, shown in credits). Rejected: a second model to consult, free fetch,
  voice and images.
- Decided: the agent works on the repos and also answers about Simone; models from
  OpenRouter (#11).

## Open

- List height: it should fit in 900 px (CLAUDE.md), today it needs about 1,000 and on
  short screens it scrolls. Left like this by Simone at the close of M15; to be picked up
  again if the showcase or the single pages grow.

- Domain: `esse.dev` is the main one. To do in the Cloudflare panel: 301 Redirect Rule
  from `simonesalerno.it` and `www.simonesalerno.it` to `https://esse.dev` with the path
  preserved. `essedev.it` is not renewed: no redirect to maintain.

- Analytics: the Umami script points to `umami.essedev.it`, but `essedev.it` is not
  renewed. Move Umami to a subdomain of `esse.dev` before it expires, or the statistics
  stop without errors.
- Email `hello@esse.dev`: check that the mailbox receives before going online.
- Merge to `main` with **squash**: the restyle branches carry in their history about 70 MB
  of PNGs of the discarded pixel art, which must not enter `main`.

## Deploy state

In production: `main` (SvelteKit). The Astro site is on the `astro` branch, not merged.
