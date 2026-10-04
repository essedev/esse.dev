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
previously:
  - name: "Verbosa"
    year: 2025
    note: "A multi-provider chat in Flutter and Go, with streaming and the model picked message by message: my first client for talking to models."
  - name: "NanoClaw"
    year: 2026
    note: "An assistant on Telegram built on the Claude Agent SDK, each group isolated in its own container."
  - name: "Life Terminal"
    year: 2026
    note: "Finance and health in one app, with an agent that reads and writes the data and changes role by section."
  - name: "Almanac"
    year: 2026
    note: "My own ChatGPT in Elixir and Phoenix, with tools, folders and hybrid RAG on pgvector."
  - name: "Nexus in Elixir"
    year: 2026
    note: "The first version of Nexus, in Elixir and Phoenix with LiveView."
  - name: "Bob"
    year: 2026
    note: "A voice assistant on Hermes Agent, with a PWA and a Discord bot: push-to-talk and streamed voice. Stopped the day Nexus restarted."
---

Nexus is where I keep tasks, projects, notes, books, expenses, meetings and my Claude Code conversations. Instead of one app per thing there is a single engine: you define a schema and the system generates storage, the API, the assistant's tools and an interface with tables, boards, calendars and dashboards.

The assistant does more than read the data. It manages it while I talk to it, and it evolves the schema: if I tell it I want to track the films I watch, it creates the type, the fields and the view. Every change is versioned and reversible, and nothing is ever really deleted.

- Automations on a cron or on an event, including agents that run on a prompt.
- Meeting transcription with separate speakers, OCR, web search and vision as generic capabilities.
- An MCP server with OAuth, so any coding agent can read and write my data.
- Claude Code chats synced from the laptop and linked to the right project: a project's activity is derived from there, not written by hand.

Python backend with FastAPI, async SQLAlchemy and PostgreSQL with pgvector, React frontend. It is self-hosted and single-user, with blue-green deploys. It is where a series of personal assistants ended up, each different from the last: they are listed below, from the first.
