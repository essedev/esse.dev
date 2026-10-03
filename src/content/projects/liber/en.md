---
slug: "liber"
title: "Liber"
excerpt: "AI sommelier for restaurants: the guest describes the dish and Liber picks, among the wines actually on the list, the ones that fit best."
tags:
  - "Python"
  - "FastAPI"
  - "React"
  - "PostgreSQL"
  - "Knowledge Graph"
  - "AI"
---

At the table, the guest types what they are eating. Liber suggests the wines on the restaurant's list that pair best and explains the choice the way a sommelier would, without ever suggesting a bottle the restaurant does not have.

It is not a wrapper around an LLM. The wine reasoning runs on a knowledge graph built with Apache AGE inside PostgreSQL: grapes, regions, styles, pairings. The model acts as a ranker and only picks from the wines actually available, so it cannot make up a label.

FastAPI backend with async SQLAlchemy, React 19 frontend with TanStack Query, models through OpenRouter. It runs in Docker on a VPS, at heyliber.com.
