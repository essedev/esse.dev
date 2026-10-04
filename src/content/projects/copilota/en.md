---
slug: "copilota"
title: "Copilota"
excerpt: "A copilot for sales calls: a macOS app in Swift that transcribes both sides of the call live and suggests answers from the knowledge base in an overlay only the seller sees."
tags:
  - "Swift"
  - "SwiftUI"
  - "macOS"
  - "FastAPI"
  - "RAG"
  - "Speech-to-text"
why: "The backend lives inside the app: Postgres with pgvector built from source, a portable Python and the code, all signed. Users install an app, not a server, and the same backend stays deployable for when the knowledge base belongs to the team."
previously:
  - name: "Sales AI Copilot"
    year: 2026
    note: "The first version, with an Electron overlay. Rewritten from scratch in Swift after spikes on transcription, fast models and retrieval."
---

On a sales call answers are needed the moment the customer asks: prices, case studies, objections heard before. Copilota listens to the call and brings them into a side overlay, hidden from screen sharing and never stealing focus from Meet.

## During the call

- Two separate channels: the microphone is the seller, system audio is the customer, captured with a Core Audio process tap. Each has its own live transcription stream.
- When the customer asks a question, raises an objection or touches a topic in the knowledge base, a fast model decides whether a card is needed and writes it with its source: in the live test the card arrives in 1.1-1.3 seconds. One card when it helps, not one per sentence.
- A direct question (⌥⌘K) about the knowledge base or the call itself, like "what did they say about budget?", goes through the same pipeline and answers in under a second.
- Experimentally, Nemotron separates the customer's voices locally, with MLX, in an isolated process with no network: on the test sample attributed sentences go from 22 to 28 out of 37.
- Without headphones the microphone picks up the customer from the speakers: an echo filter drops those sentences before they become context.

## Before and after

Before the call there is a customer brief built from previous calls, documents and a web search. Afterwards come the full transcript with voices separated, the summary, objections with the answer given, action items and a follow-up draft. In the main window an agent answers on the knowledge base, the calls and the web, with sources cited.

## Underneath

- Hybrid search, dense and lexical with Postgres's Italian stemming, fused with RRF: recall@5 of 0.97 on the test corpus.
- Background work (document ingestion with OCR, embeddings, briefs, summaries) runs on [pgbee](/en/projects/pgbee).
- Evals run on the real code: they check the key facts in answers, made-up numbers and the "it is not there" on questions outside the knowledge base.
- The Swift client is thin: no keys and no calls to providers, which all live in the backend.
