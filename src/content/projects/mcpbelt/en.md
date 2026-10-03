---
slug: "mcpbelt"
title: "mcpbelt"
excerpt: "A single MCP server that gives any agent the capabilities it cannot run locally: documents, audio, web pages, images."
tags:
  - "Python"
  - "FastAPI"
  - "MCP"
  - "AI Agents"
  - "OAuth"
  - "Astro"
---

A coding agent can write code, but it cannot read a scanned PDF, transcribe a recording or look at an image unless someone wires up a service for each of those. mcpbelt puts all of them behind one connection, one credit balance and one schema.

The individual capabilities are commodities. What matters is having all of them in a single connection, routing between providers by cost and quality, and keeping results out of the agent's context: they stay on the server and get queried when needed.

- 459 tokens instead of 6,355 for a forty-page document, which stays fully queryable.
- The first run at real scale: 50 pages and 56 minutes of audio delivered in 35 seconds, for 1.14 euros paid to providers.
- That same run found a bug no test could see: an OCR job worth 200 thousandths was charging 84. Units are now counted from the file.

FastAPI backend with OAuth 2.1 and a separate job queue, public site in Astro, top-ups through Stripe.
