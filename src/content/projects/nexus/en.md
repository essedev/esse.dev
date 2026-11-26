---
slug: "nexus"
title: "Nexus"
excerpt: "Personal data platform driven by an AI assistant: everything is an entity defined by a schema, and adding a new kind of data takes no code."
why: "Everything is an entity defined by a schema, and a new type needs no code. The agent that operates has minimal privileges, the one that changes the system works in isolation and goes through human approval."
previously:
  - name: "Plannerinator"
    year: 2024
    note: "Tasks, projects, notes and collections in SvelteKit, rewritten in Next.js a year later with health and finance taken from Life Terminal: the domain Nexus inherited."
  - name: "Verbosa"
    year: 2025
    note: "A multi-provider chat in Flutter and Go, with streaming and the model picked message by message: my first client for talking to models."
  - name: "NanoClaw"
    year: 2026
    note: "An assistant on Telegram built on the Claude Agent SDK, each group isolated in its own container."
  - name: "Life Terminal"
    year: 2026
    note: "Finance and health in one app, with an agent that reads and writes the data and changes role by section. Its finance and health moved into Plannerinator."
  - name: "Almanac"
    year: 2026
    note: "My own ChatGPT in Elixir and Phoenix, with tools, folders and hybrid RAG on pgvector."
  - name: "Nexus in Elixir"
    year: 2026
    note: "The first version of Nexus, in Elixir and Phoenix with LiveView: Almanac's runtime with Plannerinator's domain."
  - name: "Bob"
    year: 2026
    note: "A voice assistant on Hermes Agent, with a PWA and a Discord bot: push-to-talk and streamed voice. Stopped the day Nexus restarted."
now: "It is in production and I use it every day; it is becoming multi-user, with a second person who sees and changes only what they are granted. Open source comes after."
---

Nexus is where I keep tasks, projects, notes, expenses, meetings and my conversations with coding agents. Instead of one app per thing there is a single engine: you define a schema and the system generates storage, API, the tools for the assistant and an interface with tables, boards, calendars and dashboards.

The assistant does more than read the data. It manages it while I talk to it, and it evolves the schema: if I say I want to keep track of the films I watch, it creates the type, the fields and the view. Every change is versioned and reversible, and nothing is ever really deleted.

- Automations on a schedule or on an event, including agents that start from a prompt.
- Meeting transcription, reading documents and images, and web search, as generic abilities any type of data can use.
- An MCP server, so any coding agent can read and write my data.
- The chats with coding agents and the projects' commits get there on their own, linked to the right project: a project's activity comes from that.
- Sensitive changes go through my approval, and I choose how much the agent may do on its own.

## Where it stands

It is in production on my server and I use it every day. It was born for one person and is becoming multi-user: a second person signs in with their own access, sees and edits only what they are granted and has a spending cap of their own. The access is there, the test of everyday use is still missing. Open source comes after: the plan is written, the work has not started.

Python backend with FastAPI and PostgreSQL, React frontend. It is where a series of personal assistants, each different from the last, ended up: they are below, from the first.
