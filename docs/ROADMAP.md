# Roadmap

Current state of the project. Real milestones, not a wishlist. Updated together with the code.

Last update: 2026-10-28 (Cycle 32: the listing pages rebuilt)

## Context

The Astro site is on `main` and in production, and replaced the SvelteKit site (M1-M10,
history in `docs/CYCLES.md`). Closed: M14, the migration to Astro (Cycle 11, DECISIONS
#10), and M15, structure and style (Cycles 12-20, DECISIONS #15, #16, #19); the light
theme came after it (Cycle 26, DECISIONS #27), the new home and the tab bar on phones
after that (Cycle 27, #30, #31), a changelog for visitors
and a boot on the first visit in Cycle 30 (#35, #37), the projects, method, now and
about pages rebuilt in Cycle 32 (#40-#43). The "Laboratorio" restyle (M11) is paused: its motifs are
in `docs/archive/RESTYLE.md`, and its branches (`restyle/laboratory`, `restyle/base`) and
the `astro` working branch were retired when `astro` reached `main`. Their full history is
kept in a git bundle outside the repo; the discarded pixel-art PNGs were dropped from the
history that reached `main`.

## Milestones

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
- Done (Cycle 23): a cover and a logo for every published project (per DECISIONS #22);
  light variants of the rendered logos and designed covers in Cycle 26 (#28).
- Done (Cycle 30): Relay, Media Hub, Nexus and Watch OS brought up to date; Varco and
  Floppy in the showcase in place of Portsage and mcpbelt.
- Done (Cycle 32): the projects page grouped by status (#40); a `now` line per project in
  progress for the Now page (#42).
- To do: Now reads every project's real activity. Zeno has no repo under `essedev` and
  Copilota's private repo has no `activityRepo`: both show the `updated` of `meta.json`,
  which for Copilota is later than its last commit.
- To do: tags cleaned up.
- To do: a skill that proposes the new or updated items from the repos; it proposes, it
  does not publish.

### M17 - Agent - In progress

A page of the site (`/it/agente`, one row in the list) is a real agent, with tools, that
shows how it works: every tool call, model, tokens and cost per answer. It takes the place
of the earlier idea (the site redesigned live by a model). Choices in
`docs/DECISIONS.md` #11-#14.

- Done (Cycles 14-28, log in `docs/CYCLES.md`): a Durable Object per visitor with
  pi-durable and `glm-5.3-flash` from OpenRouter (#11); the site tools, `show_page` as a
  card and the code tools on the public repos (#13); the demo tools `render`, `run_code`,
  `delegate` and `draft_message` (#14), the latter live on `hello@esse.dev` with a delivery
  note for the model (#29); triage with Jev, chat to the model and `get_budget` (#12);
  per-IP limits and a red team in Jev's set (#17); no link allowlist for now (#18);
  90-day retention (#23); the states of the work and of errors (#24).
- Done (Cycle 29): sub-agents in the background (#33), on the page as chips on the field
  with the live transcript in a sheet (#34).
- Done (Cycle 30): the empty page says what the agent does (#38), the chat reads by turn
  with the work as tokens, the same in a sub-agent's sheet (#39); sub-agents talking to
  each other tried and left out (#36).
- To do: the sub-agents' sheet on phones, where chips and field leave it about half the
  screen (#34).
- Read-only tools on already public data. No writes, no fetch of arbitrary URLs, no
  private repos, no memory between visits. The only effect outside the site is the
  `draft_message` email, and it goes out only from a visitor's click.
- `@cloudflare/computer` only if running the repos' code became necessary.
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

- Listing pages (Cycle 32): the photo for the about page and its position (today it would
  open the "Scrivimi" column, #43); rereading with Simone the method's lines and proofs
  (#41) and the projects' `now` lines (#42).

- List height: it should fit in 900 px (`.claude/rules/workspace-ui.md`), today it needs
  about 1,000 and on short screens it scrolls. Left like this by Simone at the close of
  M15; to be picked up again if the showcase or the single pages grow.

- Domain: `esse.dev` is the main one; `simonesalerno.it` and `www` redirect to it with a 301
  that keeps the path (Cloudflare Redirect Rule, live). To do in Search Console: property
  `esse.dev` with its sitemap, then Change of address from the `simonesalerno.it` property
  and removal of the old sitemap there. Keep the redirect and the domain for at least a
  year. `essedev.it` is not renewed: no redirect to maintain.

## Deploy state

In production: `main` (Astro), deployed by Workers Builds on every push to `main` (Node
24.21.0, build `pnpm run build`, deploy `pnpm exec wrangler deploy`). First Astro deploy on
2026-10-05. Production secrets: `OPENROUTER_API_KEY`, `MAIL_TO` (`hello@esse.dev`) and
`TURNSTILE_SECRET`; the Turnstile site key is in the code, chosen by host (`draft.ts`).
`esse.dev` is a sending domain in Cloudflare Email Service. Not Email Routing: the
domain's mail is on Qboxmail (MX and SPF), and Email Routing would take the MX; Email
Service adds only the `cf-bounce` MX, DKIM and DMARC, and its SPF goes into the existing
record, never a second one. Optional: `GITHUB_TOKEN`. Build variable in Workers
Builds, still to set: `GITHUB_ACTIVITY_TOKEN` (#42, read access to the repos' contents, used
for dates and counts only); without it the Now page reads only the public repos, at 60
requests an hour.
