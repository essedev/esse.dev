---
slug: "servers"
title: "Personal servers"
excerpt: "Two VPS for my apps, one serving and one that tries to restore the backups every night, with the knowledge in a repo and a monitor watching everything from outside."
tags:
  - "Docker"
  - "Caddy"
  - "Cloudflare Workers"
  - "TypeScript"
  - "Ops"
why: "Checks know what the answer means: the MCP endpoint must return 401, because a 200 would mean the protection in front of it is gone."
---

In August 2026 I moved my apps to two VPS: a production one and one that keeps the backups and tries to restore them every night. What I know about those servers lives in a documentation-only repo: measured inventory, decisions with their reasons, the procedure to add an app.

- Manifest-based deploys: each app declares the files it needs on the server, and anything not in the manifest does not get there.
- Nightly backups to R2, with the restore verified every night on the second server.
- Nexus deploys blue-green, with no downtime on each release.

## monitor

A Cloudflare Worker watches everything from outside, every 5 minutes, and lives outside the infrastructure it observes. Checks look at what the answer means, not just whether it arrives: `/ready` must say the database is up, and the MCP endpoint must return 401. Events are state transitions, not repetitions: a full disk raises one alert, not 288 a day. Alerts and commands go through Telegram, and if the monitor itself goes down an external dead-man's switch fires.
