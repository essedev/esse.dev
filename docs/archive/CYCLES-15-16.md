# Cycles 15-16 (archive)

Cycles archived from `docs/CYCLES.md`, numbering intact. The earlier ones in
`CYCLES-1-6.md`, `CYCLES-7-8.md`, `CYCLES-9-10.md`, `CYCLES-11-12.md` and `CYCLES-13-14.md`.

---

## Cycle 15 - The agent reads the projects and their code (2026-10-03)

Second cut of M17: from 2 to 9 tools, split in the page between "on the site" and "on the
code".

- **Site:** `list_projects` (filters by status and tag, showcase first; the index now marks
  the projects in the showcase) and `show_page`, which becomes a card to open in the
  transcript instead of navigating (DECISIONS #13).
- **Code:** `repo_overview`, `list_files`, `read_file`, `search_code`, `recent_commits` on
  the GitHub REST API, only on the repos of the published projects plus the site's.
  `read_file` numbers the lines, gives the GitHub link and reads long files in pieces;
  answers cached for 5 minutes; `GITHUB_TOKEN` optional.
- **Real trials:** the first call on the Worker failed with "Illegal invocation" (`fetch`
  saved in a field loses its `this`; in Node and in tests it does not happen). On the
  question "how does Portsage know which ports are busy" the agent finds `scanner.rs` in 7
  calls, for about 0.2 cents; the prompt now asks to copy the code without invented
  comments and to cite the lines with the link.
- **Agent page** (afa1abe): it read like a document, with the input where a 55vh minimum
  ended and an empty conversation with nothing. Now the input stays fixed at the bottom of
  the pane and the page fills it (on mobile the content column grows too). With an empty
  conversation: the tools announced by the server, how triage and costs work, three
  suggested questions that start immediately. The transcript follows the answer only if
  the reader is already at the bottom.
- **Transcript:** answers use the same prose styles as the site (lists, code blocks,
  links).
- **Tests:** 87 unit and 54 E2E.
- **Next step:** `GITHUB_TOKEN` to create; then `render` and `run_code`, together with the
  evaluation of `@cloudflare/computer`.

## Cycle 16 - The agent's demo tools (2026-10-03)

Third cut of M17 (`14bc4be` .. `871d7eb`): from 9 to 13 tools, with a "Capabilities" group
in the page.

- **`render`:** bars, tables and timelines from data, never HTML; same validation on the
  server and in the browser, bars in SVG for the CSP.
- **`run_code`:** Cloudflare's Code Mode (`@cloudflare/codemode`) in a Dynamic Worker with
  no network; the read-only tools inside the sandbox, with types generated from the
  schemas. JavaScript and not Python, chosen with Simone (#14). Trial: 12 parallel calls on
  the 6 repos in one execution, then a table with `render`, about 0.14 cents.
- **`delegate`:** 2-3 sub-agents as pi-durable conversations owned by the call, with only
  the read-only tools; their cost is deducted by the tool. Trial on the Relay, Portsage,
  Templator comparison: 3 children of 6-7 calls, about 1.4 cents and 50 s.
- **`draft_message`:** editable draft, sending by the visitor after Turnstile, caps of 3 a
  day per visitor and 30 for the site, email via `send_email` to `MAIL_TO`. A draft
  invented on the socket is rejected.
- **Bugs found in the trials:** a Svelte prop called `state` broke `$state` at runtime
  with no check error; Markdown headings in the answers came out huge.
- **Tests:** 99 unit and 54 E2E.
- **Next step:** tuning of secrets and Email Routing for production (in ROADMAP),
  sub-agent events live.
- **Credits and caps (after):** budget per visitor at 10 cents, shown in credits (1,000 a
  day) and only below 30%; cap of 12,000 tokens per `delegate` child and no children
  without credits for the worst case. Same question on three repos: from about 140 to 93
  credits, from 50 to 29 s.
