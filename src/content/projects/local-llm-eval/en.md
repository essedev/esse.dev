---
slug: "local-llm-experiments"
formerSlugs:
  - "local-llm-eval"
title: "Local LLM Experiments"
excerpt: "Experiments with local models on a 32 GB MacBook Pro M5: how well they hold up as coding agents, how fast they run and how to make them fit in memory."
tags:
  - "LLM"
  - "MLX"
  - "Benchmark"
  - "AI Agents"
  - "Research"
  - "Python"
now: "I am measuring how usable the Mac stays while a large model runs inside a RAM cap."
why: "The scope of validity and what I did not measure are written before the results."
---

Since May 2026 I have used my 32 GB MacBook Pro M5 to find out what can really be done with local models. There are three questions, which came one after the other.

## Do they hold up as coding agents?

The task is always the same: a small app with a backend and a frontend, generated from scratch inside a harness and scored against a fixed rubric. The first rounds left two indications, to be taken as such:

- on a small project a well-chosen local model is on par with cloud models;
- local tool calling needs three things aligned: the model's training, the chat template and the server's parser. If one link is broken, the model fails out of the box.

The rest I archived. The comparison between giving the work all at once and splitting it into steps was unbalanced, because the two modes got different instructions. I started again with a stricter method, and that round is still to finish. The scope is small and the repo says so before the results: one task, almost always a single run, no refactors and no long contexts.

## How fast do they run?

In August I measured why a model that is smaller on disk can be many times slower than a larger one. A dense model rereads all its weights for every token, an MoE one activates only part of them: on the same machine the first did 8 tokens per second, the other two 40 and 60. The limit is how many GB per second the memory can move, not how much RAM there is.

## moe-stream

In November the question became a different one: running a large model without it taking the whole Mac. macOS has no way to cap a process's memory, so the limit has to come from the engine. moe-stream is a fork of llama.cpp for MoE models: you give it a RAM cap, and the weights that do not fit are read from the SSD when needed.

The measurements are from 23 November, on the same Mac, and I will redo them before the repo goes public:

- The model stays inside the memory you give it, and its answers are bit-for-bit identical to those of the model fully in memory.
- You pay in speed: a 16 GB model does 21-23 tokens per second fully in memory and 12-17 with a 12 GiB cap.
- A 102 GB model runs on the 32 GB Mac, at about 7 tokens per second. There the limit is the SSD.

What I have not measured yet is the reason I did it: how usable the Mac stays for everything else while the model runs.

## LLM Dash

For daily use there is [LLM Dash](https://github.com/essedev/llm-dash), the control panel for local models on my Mac: the model profiles in a single file, switching from one model to another in the browser, memory kept in view (on 32 GB one large model fits at a time) and a chat that also shows the model's reasoning. It is open source under the MIT license.
