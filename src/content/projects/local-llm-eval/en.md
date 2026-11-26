---
slug: "local-llm-experiments"
title: "Local LLM Experiments"
excerpt: "How far agentic coding goes with local models on a 32 GB MacBook Pro M5, measured against cloud models."
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

I wanted to know whether a local model can really act as a coding agent, not in a demo but in a harness that writes a whole app. The task is always the same: a CRUD app with a FastAPI and SQLite backend and a React frontend, generated from scratch and scored against a fixed rubric.

- On a small scaffold, Qwen3.6-35B-A3B quantized to 4 bits with MLX scored 18 out of 18 in 3.5 to 7 minutes, with no human fixes. Replicated twice.
- On the same task Opus 4.7 scored 17 out of 18 at 0.76 dollars per run, DeepSeek V4 Flash 17 out of 18 at 0.002: cost differs by a factor of about 380, the result stays within the rubric's noise.
- Local tool calling needs three things aligned: the model's training, the chat template and the server's parser. If one link is broken, the model fails out of the box.
- Splitting the work into a roadmap rescues fragile models but breaks capable ones, because resetting context between tasks loses coherence.

The scope is narrow and the repo says so: one task, most cells with N=1, no data on refactors or long contexts. It is a qualitative starting point, not a benchmark. Logs, generated code, scores and costs for every run are public.

## moe-stream

In November 2026 the question became a different one: running a large model without it taking the whole Mac. macOS has no way to cap a process's memory, and llama.cpp with Metal locks the model's pages in memory. So the limit has to come from the engine. moe-stream is a fork of llama.cpp for MoE models, the ones that use only part of their weights for each token: you give it a RAM cap, and what does not fit is read from the SSD when needed.

Measurements of 23 November on the same 32 GB M5, to be redone before the repo goes public:

- The cap holds: with 12 GiB the model locks 12.2, with 16 it locks 16.3.
- Tokens and probabilities are bit-for-bit identical to those of the model fully in memory.
- Inkling 2 Mini, 16.5 GB on disk, does 21-23 tokens per second fully in memory, 17.6-19.8 with a 16 GiB cap, 12-17 with 12 and 6-11 with 8.
- Qwen3.8 Flash Next, 102 GB on disk, runs on the 32 GB Mac at about 7.5 tokens per second with a 12-16 GiB cap. There the limit is the speed of the SSD.

I brought the same cap to an MLX-based server too. What I have not measured yet is the reason I did it: how usable the Mac stays for everything else while the model runs. The repo is still private.

## LLM Dash

For daily use there is [LLM Dash](https://github.com/essedev/llm-dash), the control panel for local models on my Mac: four ready profiles (build, coder, plan and a fast one for when memory is tight), served with `mlx_lm.server`, a dashboard to switch models and watch memory and speed, and opencode integration. Only models whose tool calling was actually verified, with the same harness as the experiments, make it into a profile.
