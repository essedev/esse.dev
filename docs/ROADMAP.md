# Roadmap

Current state of the project. Real milestones, not a wishlist. Updated together with the code.

Last update: 2026-10-06 (Cycle 24: analytics, privacy notice, conversations that expire)

## Context

The Astro site is on `main` and in production, and replaced the SvelteKit site (M1-M10,
history in `docs/CYCLES.md`). Closed: M14, the migration to Astro (Cycle 11, DECISIONS
#10), and M15, structure and style (Cycles 12-20, DECISIONS #15, #16, #19). The
"Laboratorio" restyle (M11) is paused: its motifs are in `docs/archive/RESTYLE.md`, and its
branches (`restyle/laboratory`, `restyle/base`) and the `astro` working branch were retired
when `astro` reached `main`. Their full history is kept in a git bundle outside the repo;
the discarded pixel-art PNGs were dropped from the history that reached `main`.

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
- Done (Cycle 23): a cover and a logo for every published project (per DECISIONS #22).
- To do: tags cleaned up.
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
  repos via the GitHub API (#13). The site repo is read from the `main` branch.
- Done (Cycle 16): the demo tools, one per capability, with the limits in code: `render`
  (bars, tables, timelines), `run_code` (Code Mode in a Dynamic Worker), `delegate` (2-3
  pi-durable sub-agents), `draft_message` (a draft the visitor sends, after Turnstile).
  Choices in #14.
- Done (Cycle 19): chat goes to the model, which answers briefly and without tools (#12);
  per-IP limits, burst of 10 messages a minute and 50 cents a day (#17); red team: 10
  attacks in Jev's set, passed live too. No allowlist of external links until
  conversations are shareable (#18).
- Done (Cycle 24): conversations expire 90 days after the last message, stated in the
  privacy notice (#23).
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

- Email `hello@esse.dev`: check that the mailbox receives; the contacts and the privacy
  notice point to it.

## Deploy state

In production: `main` (Astro), deployed by Workers Builds on every push to `main` (Node
24.21.0, build `pnpm run build`, deploy `pnpm exec wrangler deploy`). First Astro deploy on
2026-10-05. Production secrets: `OPENROUTER_API_KEY`. Missing, so `draft_message` fails with
an explicit error: `TURNSTILE_SECRET` with `PUBLIC_TURNSTILE_SITE_KEY` at build time, and
`MAIL_TO` with Email Routing active on `esse.dev`. Optional: `GITHUB_TOKEN`.
