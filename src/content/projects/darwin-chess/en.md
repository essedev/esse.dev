---
slug: "darwin-chess"
title: "darwin-chess"
excerpt: "A cheap LLM agent writes a chess engine in Rust from an empty project and keeps evolving it on its own: a change stays only if it beats the previous version in real games."
tags:
  - "AI Agents"
  - "Rust"
  - "Chess"
  - "Research"
  - "Python"
  - "FastAPI"
  - "React"
  - "Docker"
why: "The agent controls the whole engine and has no access to the environment that verifies it: it can neither see it nor touch it. Even the legal-move check uses random positions, because the counts for the standard ones are known and could be written in by hand."
now: "It has been running day and night since 25 November and is at its fifteenth generation; I am measuring how much it pays to let it think harder in each session."
---

I wanted to see how far a cheap agent gets when left alone, as long as it cannot cheat on the measurement. Chess is the ideal environment: the verdict is a game, it costs little and nobody can argue with it. So I gave Claude Haiku an empty Rust project and a single rule: a change survives if it beats the previous version.

## How it works

- The engine belongs to the agent: it writes it, changes it and submits its changes. Every accepted submission is a generation, and every generation is a commit.
- The verification environment is out of its reach. A submission has to compile, generate the right moves on random positions, hold up in a few test games and then win a match against the reigning champion, settled by a statistical test and not by eye. Every engine plays in its own container, with no network.
- Every new champion faces Stockfish at limited strength over a ladder of levels. What comes out is an Elo with its margin of error.
- Every session starts from a fresh context: what the agent knows lives in the history of the code and in the ledger of experiments. Every ten attempts it rereads everything and rewrites its own strategy.
- On Lichess a bot plays with the reigning champion, when Lichess lets it. Nothing is judged there: the losses go back to the agent as lessons, analysed by Stockfish.

## What has happened so far

The numbers are from 26 November, after a day and a half. The current ones are live on [darwin.esse.dev](https://darwin.esse.dev), together with the games, the agent's reasoning and the spend.

- Fewer than half of the submissions survive. The others lose the match, fail the checks or start from a base that has already been overtaken.
- The Elo against Stockfish went from about 1,200 to about 2,000. For a chess engine that is low: for now I am watching the slope.
- A session costs a little over a cent. What queues up is the CPU that plays the games, not the model.
- For four generations the agent only tweaked the evaluation, gaining little. It was supposed to reread its own history every ten attempts and had never done it, because of a bug of mine. With that fixed, its first real reflection sent it another way and it made the biggest jump up to then. In the same round I also let it think harder in each session, so I cannot say which of the two mattered.

One limit is worth saying up front: the agent knows chess engine techniques by heart and is applying them more or less in textbook order. So what I am measuring so far is how well it applies known things under a verification it cannot bend, not a discovery. The plan is for the chess knowledge to come from a network trained on the engine's games against itself, instead of from the model's memory.

It runs on a fanless MacBook Air M4, at home. The code is open source under the MIT license.
