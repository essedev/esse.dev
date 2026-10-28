---
slug: "relay"
title: "Relay"
excerpt: "Native macOS terminal built for running many coding agents in parallel, with each agent's state read from hooks instead of parsed output."
tags:
  - "Swift"
  - "AppKit"
  - "macOS"
  - "AI Agents"
  - "Claude Code"
  - "Homebrew"
why: "Each agent's state comes from Claude Code and Codex hooks, not from parsing output, so it stays right even under a wall of logs. I wrote it in Swift starting from zero Swift experience."
now: "Updates install from the popup; next, the terminal engine split from the rest."
---

I work with five or six Claude Code and Codex sessions open at once, across different projects. In a regular terminal, finding out which agent is waiting for an answer means going tab by tab. Relay exists to remove that loop.

## How it works

- Each agent's state (running, waiting for input, error, done) comes from native Claude Code and Codex hooks, not from parsing output. It stays right even under a wall of build logs.
- A three-step attention model: a session that wants you gets loud, one you have seen stays in the background, replying clears it.
- Home (Cmd+D) says how many sessions are waiting for you and lists them with the last line each agent left and the action it wants, then what is running and which projects have gone quiet.
- A project closes without being lost: it keeps its group, tabs and agent sessions, and stops its processes so the memory comes back. The sidebar shows only open projects, Projects lists all of them and Cmd+P reopens one by name.
- Workspaces with groups, split panes with their own tabs, multiple windows and a layout that survives a restart. Updates install from the app, which then offers a restart.

It is written in Swift 6 and AppKit, with SwiftTerm as the engine behind an abstraction that leaves room for libghostty. Idle terminals are unloaded from memory: about 90 MB resident with one live terminal, 92 with thirteen, and 2.4 µs added in the worst case on a keystroke. Method and numbers are in the repo.

It is open source under the MIT license and installs with Homebrew: `brew install --cask essedev/relay/relay-terminal`.
