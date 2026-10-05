---
slug: "printor"
title: "printor"
excerpt: "A quant research lab around a single question: where an LLM gives a real edge in trading, if it does. With a harness built so I could not fool myself."
tags:
  - "Python"
  - "LLM"
  - "Quant"
  - "DuckDB"
  - "Research"
why: "The test that matters is on the model's cutoff: on events after its training the edge disappears, so a good part of the result was leakage."
---

An LLM cannot predict prices, and the data everyone has is already priced in. What it does better than average is read: turning text almost nobody really reads (SEC filings, earnings call transcripts, news, forum analyses) into a structured, dated signal. printor is the lab to find out whether there is an edge there, and where.

The model has two roles. The first is to read and extract the signal. The second is to act as a critic: propose hypotheses, write the backtests, hunt for biases. But the rigour does not come from trusting the model, the harness enforces it: every data point carries the date it was actually available, costs are estimated name by name from the spread, every strategy is compared with buy and hold, a random baseline and a Sharpe ratio deflated for the number of attempts, and hypotheses are written down before looking at results.

## The first two signals

- The tone of 8-Ks, the filings US companies make when something happens. On 9,304 events and 604 names it seemed to beat buy and hold, Sharpe 1.35 against 0.86. On events surely after the model's training the per-event edge drops to +15 basis points, t=0.31: a good part of the result was leakage, the model already knew how those stories ended.
- How the language changes from one filing to the next: null once the market effect is removed. It cost nothing, because the free test came before the paid one.

Two negative results, and that is why I show it: the harness takes false positives apart almost for free. The road from here is open: combining several sources per name (filings, insider buying, government contracts), which is the game where an LLM has a real edge, or testing the signal forward, in paper trading.
