---
slug: "wavelength"
title: "Wavelength"
excerpt: "A radio made by AI, born at a Milan AI Week 2026 hackathon: a newsroom of agents picks and checks the news, two AI hosts talk about it live."
tags:
  - "AI Agents"
  - "Python"
  - "FastAPI"
  - "PostgreSQL"
  - "React"
  - "Hackathon"
---

I built it in three days for the AI Agent Olympics at Milan AI Week 2026. A newsroom of agents reads the sources, picks the stories, checks and writes them; two AI hosts discuss them in a multi-turn dialogue, generated and read out as a stream.

## How it is built

- Agents never talk to each other directly: they write to and read from an append-only event log in Postgres, woken up with LISTEN/NOTIFY, and every message is validated against a schema.
- Trust grows along the chain: source validation, research, a panel of critics. Whoever comes later does not redo the work of whoever came before.
- The dialogue is designed to have no gaps: while one host speaks, the other's line is already being prepared.

In three days the newsroom with its event log, the source intake and the studio interface got built; the rest of the chain stayed in the design when the hackathon ended.
