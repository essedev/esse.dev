---
slug: "watch-os"
title: "Watch-OS"
excerpt: "My own firmware for an ESP32-S3 smartwatch: press a button, speak, and an agent living on a server answers."
tags:
  - "C"
  - "ESP-IDF"
  - "ESP32"
  - "Embedded"
  - "Voice"
---

A smartwatch with an ESP32-S3 and a 2-inch AMOLED screen, with firmware written in C on ESP-IDF. The idea is a watch that only acts as microphone and speaker for an agent: transcription, model, tools and voice all live on the server.

Push-to-talk instead of a wake word: less battery and no accidental triggers. Audio goes back and forth over a full-duplex WebSocket, so the answer can arrive while the model is still generating it.

The firmware has the launcher, Wi-Fi, power management, synced time and settings. It stopped before the part that matters, the voice app: the audio and WebSocket components are in place, the wiring is missing.
