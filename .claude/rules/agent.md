---
paths:
  - 'src/agent/**'
  - 'src/components/agent/**'
  - 'tests/e2e/agent*.spec.ts'
  - 'tests/eval/**'
---

# Agent

- Code in `src/agent/` and `src/components/agent/`; why and how in ARCHITECTURE (Agent),
  DECISIONS #11-#14, #17-#18, #24.
- Every message to the agent in preview calls real models on OpenRouter
  (`OPENROUTER_API_KEY`) and the code tools the GitHub API (`GITHUB_TOKEN` optional). The
  E2E tests send no messages to the model: `agent-states.spec.ts` answers the socket itself
  with pi's events (`routeWebSocket`). A new state of the page is derived in `phaseOf`
  (`src/agent/phase.ts`), not with a new server event. Locally `draft_message` sends into
  wrangler's simulator (the text ends up in `.wrangler/tmp/email/`): to try it you need
  `MAIL_TO`, even a fake one (`wrangler dev --var MAIL_TO:prova@example.com`).
- Model, provider order and timeouts in `src/agent/models.ts`; existing conversations move
  to the new model when the object starts. Spending limits in `src/agent/budget.ts`
  (visitor, IP, site), per-IP burst with the `AGENT_RATE` binding. Triage in
  `src/agent/triage.ts`, Jev's transport in `JEV_TRANSPORT` of `src/agent/site-agent.ts`.
- A new tool is a pi-durable `ToolRegistration`, with `replay: 'safe'` only if rerunning it
  has no effects. Site data is read from the `/agent/index.json` index (generated at
  build), never from outside.
- A note for the model only is a pi-durable `write` with a `model` message
  (`#noteDelivery` in `site-agent.ts`): its kind must be dropped in `projectEntry`
  (`src/agent/transcript.ts`), or the page shows it as the visitor's message.
