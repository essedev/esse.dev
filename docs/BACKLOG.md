# Backlog

Open work nobody is about to start, by area and in no order. A milestone in
`docs/ROADMAP.md` is picked from here; an item leaves when it is done (the story goes in
`docs/CYCLES.md`) or dropped (the why, if it binds the future, in `docs/DECISIONS.md`).

## Pages

- The photo for the about page and its position: today it would open the "Scrivimi" column
  (#43).
- Rereading with Simone the method's lines and proofs (#41) and the projects' `now` lines
  (#42).
- List height: it should fit in 900 px (`.claude/rules/workspace-ui.md`), today it needs
  about 1,000 and on short screens it scrolls. Left like this by Simone at the close of
  M15; to be picked up again if the showcase or the single pages grow.

- The project page shows a `/releases` link for every entry with a repo, even when the repo
  has no release (darwin-chess, mcpbelt, Local LLM Experiments).
- `tests/e2e/navigation.spec.ts`, "a vertical swipe in it scrolls the list": it fails about one
  run in six when the whole suite runs after a build (the list's `scrollTop` stays 0), and
  passed 25 times out of 25 alone. Seen on 2026-11-26; it looks like the touches racing the
  sheet's opening, not yet proven.

## Agent

- `@cloudflare/computer`, only if running the repos' code became necessary (#13).

## Domain

- `esse.dev` is the main one; `simonesalerno.it` and `www` redirect to it with a 301 that keeps
  the path (Cloudflare Redirect Rule, live). To do in Search Console: property `esse.dev` with
  its sitemap, then Change of address from the `simonesalerno.it` property and removal of the
  old sitemap there. Keep the redirect and the domain for at least a year. `essedev.it` is not
  renewed: no redirect to maintain.
