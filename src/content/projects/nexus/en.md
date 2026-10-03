---
slug: "nexus"
title: "Nexus"
excerpt: "Personal data platform driven by an AI assistant: everything is an entity defined by a schema, and adding a new kind of data takes no code."
tags:
  - "Python"
  - "FastAPI"
  - "React"
  - "PostgreSQL"
  - "AI Agents"
  - "MCP"
why: "Everything is an entity defined by a schema, and a new type needs no code. The agent that operates has minimal privileges, the one that changes the system works in isolation and goes through human approval."
---

Nexus is where I keep tasks, projects, notes, books, expenses, meetings and my Claude Code conversations. Instead of one app per thing there is a single engine: you define a schema and the system generates storage, the API, the assistant's tools and an interface with tables, boards, calendars and dashboards.

The assistant does more than read the data. It manages it while I talk to it, and it evolves the schema: if I tell it I want to track the films I watch, it creates the type, the fields and the view. Every change is versioned and reversible, and nothing is ever really deleted.

- Automations on a cron or on an event, including agents that run on a prompt.
- Meeting transcription with separate speakers, OCR, web search and vision as generic capabilities.
- An MCP server with OAuth, so any coding agent can read and write my data.
- Claude Code chats synced from the laptop and linked to the right project: a project's activity is derived from there, not written by hand.

Python backend with FastAPI, async SQLAlchemy and PostgreSQL with pgvector, React frontend. It is self-hosted and single-user, with blue-green deploys. This is the second version: the first one was in Elixir and Phoenix.
