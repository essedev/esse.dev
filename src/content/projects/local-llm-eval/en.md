---
slug: "local-llm-eval"
title: "Local LLM Eval"
excerpt: "How far agentic coding goes with local models on a 32 GB MacBook Pro M5, measured against cloud models."
tags:
  - "LLM"
  - "MLX"
  - "Benchmark"
  - "AI Agents"
  - "Research"
  - "Python"
---

I wanted to know whether a local model can really act as a coding agent, not in a demo but in a harness that writes a whole app. The task is always the same: a CRUD app with a FastAPI and SQLite backend and a React frontend, generated from scratch and scored against a fixed rubric.

- On a small scaffold, Qwen3.6-35B-A3B quantized to 4 bits with MLX scored 18 out of 18 in 3.5 to 7 minutes, with no human fixes. Replicated twice.
- On the same task Opus 4.7 scored 17 out of 18 at 0.76 dollars per run, DeepSeek V4 Flash 17 out of 18 at 0.002: cost moves by four orders of magnitude, the result stays within the rubric's noise.
- Local tool calling needs three things aligned: the model's training, the chat template and the server's parser. If one link is broken, the model fails out of the box.
- Splitting the work into a roadmap rescues fragile models but breaks capable ones, because resetting context between tasks loses coherence.

The scope is narrow and the repo says so: one task, most cells with N=1, no data on refactors or long contexts. It is a qualitative starting point, not a benchmark. Logs, generated code, scores and costs for every run are public.
