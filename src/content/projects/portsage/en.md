---
slug: "portsage"
title: "Portsage"
excerpt: "macOS menubar app that manages ports across development projects, with an MCP server and a CLI for agents."
tags:
  - "Rust"
  - "Tauri"
  - "React"
  - "macOS"
  - "MCP"
  - "CLI"
why: "Born from a trivial problem that AI productivity created, five projects open and \"address already in use\" every morning. It ships an MCP server, so the agents ask for ports themselves."
---

With four or five projects open in parallel, each with its own Vite, PostgreSQL and Redis, ports collide all the time. Portsage keeps the ledger: which port belongs to whom, which ranges are free, which processes are running without belonging to any project.

- A menubar popover for the state at a glance, and a window to manage projects and settings.
- An MCP server: Claude Code, Cursor, Codex and other agents reserve ports and register services on their own when they scaffold a project.
- A CLI for scripts and the terminal, and a headless Linux variant reachable over SSH, with automatic port forwarding.

Tauri 2 with a Rust backend and a React interface. It is open source and installs with Homebrew.
