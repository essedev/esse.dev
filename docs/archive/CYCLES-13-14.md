# Cycles 13-14 (archive)

Cycles archived from `docs/CYCLES.md`, numbering intact. The earlier ones in
`CYCLES-1-6.md`, `CYCLES-7-8.md`, `CYCLES-9-10.md` and `CYCLES-11-12.md`.

---

## Cycle 13 - The workspace, refined in short rounds (2026-10-03)

Short rounds looking at the site, each correction of Simone turned into a rule in the
project's `CLAUDE.md`.

- **One control per type:** a single search (it also filters the registry, it also
  searches in tags), a single cursor, no accent line on the selection. Palette and
  registry search field removed. The Umami script in the head held back the load event on
  a slow network and was the real cause of the unstable E2E tests: it now starts after
  load and only on esse.dev.
- **Two columns:** top bar and status bar made a two-tone T that matched no zone. Now list
  and pane are as tall as the window, the pane has a toolbar (path, document actions,
  language) and the "back to top" is no longer in the content: breadcrumb, Esc and
  "‹ section" on mobile, with history when arriving from the parent (the registry's
  filters stay).
- **Pager and list:** the pager sits at the bottom of the pane even on short pages, h/l
  to browse (not `[`/`]`: on the Italian Mac keyboard they need Option). The list goes in
  order of importance and fits in 900 px: about and now, then the showcase of 6 projects
  with "all N", method, writing.
- **Agent plan (M17):** a page is a real agent on Cloudflare (Agents SDK, pi-agent-core
  1.x, Svelte island), in place of the idea of the site redesigned live. Choices in
  `docs/DECISIONS.md` #11.
- **Tests:** 58 unit and 50 E2E.

## Cycle 14 - The site agent, first version (2026-10-03)

First cut of M17 (`f3b1955` .. `ed09dab`): `/it/agente` (and `/en/agent`) is a row of the
list and a static page with a Svelte island that opens a WebSocket to a Durable Object per
visitor.

- **Base:** `SiteAgent` hosts pi-durable with the Agents SDK's `PiHarness`; conversation in
  the object's SQLite, resume after a suspension. Tools `search_site` and `read_page` on
  the `/agent/index.json` index generated at build. Socket protocol and event reducer
  adapted from the official example (MIT). The Worker code has its own tsconfig: the
  Cloudflare runtime types clash with the DOM ones.
- **Models:** started on the `AI` binding (Workers AI), moved to `glm-5.3-flash` from
  OpenRouter with the fastest providers in order: the same question with three tools from
  about 40 s to about 7. 30 s timeout on the stream, pi's retries, notice and "retry" after
  a final error (DECISIONS #11).
- **Triage and spend:** every message goes first through Jev, which stops off-topic and
  abuse and picks the language; limit in real cost per visitor and for the site
  (`Ledger`). Jev moved from Workers AI (it needed AI Gateway credits) to TypeSafe direct
  and finally to OpenRouter with the same key as the model; it receives the site's titles
  as `site_topics`, without which it read "Relay and Portsage" as off-topic (DECISIONS
  #12).
- **Jev evaluation:** 54 labeled messages and `pnpm eval:jev` (real calls, outside
  `test:ci`). The first trial let through 4 of the 19 messages that should be stopped; with the
  thresholds on the off-topic plus abuse mass the result is 53 out of 54, 0 legitimate
  questions stopped.
- **Transcript:** sanitized Markdown, collapsed reasoning, Jev's verdict, tokens, cost and
  remaining budget per answer.
- **Tests:** 73 unit and 52 E2E (the agent's E2E tests open the session but do not send
  messages, which would call a real model).
- **Next step:** the tools that remain in M17 (`list_projects`, public repos, `open_page`,
  then the demo ones) and Turnstile.
