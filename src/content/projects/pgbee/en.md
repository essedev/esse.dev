---
slug: "pgbee"
title: "pgbee"
excerpt: "A PostgreSQL extension: you declare in SQL that a column is derived from others by a model, and the database keeps it filled, versioned and accounted for."
tags:
  - "PostgreSQL"
  - "SQL"
  - "Python"
  - "LLM"
  - "Embeddings"
  - "Open Source"
why: "The guarantees live in the database, in SQL and PL/pgSQL: queue, versions, lineage and human corrections. The worker is replaceable, and under crashes pgbee leaves no row empty and never overwrites someone who fixed a value by hand."
---

When a model fills a column (a ticket's category, a summary, an embedding) you always need the same things: a queue, retries, knowing which prompt produced which value, never overwriting someone who corrected it by hand. pgbee puts them inside Postgres.

## How it works

- `bee.add_column` declares the column: table, source columns, type, prompt and model. From then on triggers queue every new or changed row, and the backfill starts.
- A worker claims jobs through a four-function contract and calls the model (OpenRouter, OpenAI or a local one). The Python worker is the reference, but any process that speaks the contract works.
- Every value carries its model, prompt version, confidence and cost. A value corrected by hand is never touched again.
- Four backends: language models with structured output, decision models with class probabilities, embeddings, and your own workers.

## The numbers

A field test on 3,000 real complaints from the public CFPB database, with four derived columns: 12,000 jobs, zero failed, zero retried, about 0.14 USD per 1,000 rows. When the model is confident (0.9 or more) it agrees with the consumer's label 86-88% of the time, below 0.5 only 32-35%: confidence is what sends doubtful rows to review.

Then I put it under crashes against two classic application-side designs, "save then enqueue" and the transactional outbox: processes killed every 60 operations, the external queue going down, the prompt changing halfway, people correcting 3% of the values. On 2,000 rows pgbee leaves no row empty, keeps no stale value that looks fresh and overwrites no correction; the other two do.

It is open source under the Apache 2.0 license.
