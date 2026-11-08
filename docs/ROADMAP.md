# Roadmap

Current state of the project: the milestones about to be done, in order. The rest of the open
work is in `docs/BACKLOG.md`, what is closed in `docs/CYCLES.md`.

Last update: 2026-11-08 (Cycle 34: closed work out, Open moved to the backlog)

## Context

The Astro site is on `main` and in production, and replaced the SvelteKit site (DECISIONS #10).
The "Laboratorio" restyle (M11) is paused: its motifs are in `docs/archive/RESTYLE.md`, its
branches were retired and their full history is kept in a git bundle outside the repo.

## Milestones

### M16 - Projects - In progress

Principles, voice and sorting in `docs/features/progetti.md`. Client work stays out by default;
a private repo is published only item by item.

- To do: rereading the entries with Simone. Facts (dates, activity, stack) come from the
  sources, the text is written by hand, including the "Why" box.
- To do: tags cleaned up.
- To do: a skill that proposes the new or updated items from the repos; it proposes, it
  does not publish.
- Copilota's private repo has no `activityRepo`, so its name stays out of the public files:
  Now shows the `updated` of `meta.json`, kept at its last commit (2026-01-13).

### M17 - Agent - In progress

A page of the site (`/it/agente`, one row in the list) is a real agent, with tools, that
shows how it works: every tool call, model, tokens and cost per answer. Choices in
`docs/DECISIONS.md` #11-#14.

- To do: the sub-agents' sheet on phones, where chips and field leave it about half the
  screen (#34).
- To measure with real traffic: whether the weight estimated by the triage predicts the real
  cost of the answers (both exist for every message). Only if it predicts it well, use it
  to choose which tools to offer; today the weight is shown and that is all.
- Scope: read-only tools on already public data. No writes, no fetch of arbitrary URLs, no
  private repos, no memory between visits. The only effect outside the site is the
  `draft_message` email, and it goes out only from a visitor's click. Rejected: a second model
  to consult, free fetch, voice and images.
- Cost measured in preview: a simple question 0.05-0.1 cents, one with `run_code` about 0.15,
  one with `delegate` about 0.9 with the per-child cap (it was 1.4; budget of 10 cents a
  day per visitor, shown in credits).

## Deploy state

In production: `main` (Astro), deployed by Workers Builds on every push to `main` (Node
24.21.0, build `pnpm run build`, deploy `pnpm exec wrangler deploy`). First Astro deploy on
2026-10-05. Production secrets: `OPENROUTER_API_KEY`, `MAIL_TO` (`hello@esse.dev`) and
`TURNSTILE_SECRET`; the Turnstile site key is in the code, chosen by host (`draft.ts`).
`esse.dev` is a sending domain in Cloudflare Email Service. Not Email Routing: the
domain's mail is on Qboxmail (MX and SPF), and Email Routing would take the MX; Email
Service adds only the `cf-bounce` MX, DKIM and DMARC, and its SPF goes into the existing
record, never a second one. Optional: `GITHUB_TOKEN`. Build variable in Workers
Builds: `GITHUB_ACTIVITY_TOKEN` (#42, read access to the repos' contents, used
for dates and counts only); without it the Now page reads only the public repos, at 60
requests an hour.
