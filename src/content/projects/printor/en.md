---
slug: "printor"
title: "printor"
excerpt: "A lab to find out whether an LLM reading listed companies' filings finds a signal the market has not priced in yet, with a harness built so I could not fool myself."
tags:
  - "Python"
  - "LLM"
  - "Quant"
  - "DuckDB"
  - "Research"
why: "The test that matters is on the model's cutoff: on events after its training the edge disappears, so a good part of the result was leakage."
---

The question is narrow: does an LLM reading 8-Ks, the filings US companies make when something happens, find a signal the market has not priced in yet? The model reads and classifies, it does not predict prices.

Most of the care went into the harness. Every data point carries the date it was actually available, costs are estimated name by name from the spread instead of a flat percentage, and every strategy is compared with buy and hold, a random baseline and a Sharpe ratio deflated for the number of attempts. Hypotheses are written down before looking at results.

## What came out

- On 9,304 events and 604 names the signal seemed to beat buy and hold: Sharpe 1.35 against 0.86.
- Then the cutoff test: on events surely after the model's training, the per-event edge drops to +15 basis points, t=0.31. Not significant. A good part of the result was leakage: the model already knew how those stories ended.
- A second experiment, on language changes from one filing to the next, is null once the market effect is removed. It cost nothing, because the free test came before the paid one.

The conclusion is a negative result, and that is why I show it: the harness did what I built it for.
