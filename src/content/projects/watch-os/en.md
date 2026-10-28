---
slug: "watch-os"
title: "Watch OS"
excerpt: "My own firmware for an ESP32-S3 smartwatch: press a button, speak, and the Nexus agent answers."
tags:
  - "C++"
  - "ESP-IDF"
  - "ESP-Brookesia"
  - "ESP32"
  - "Embedded"
  - "Voice"
previously:
  - name: "Watch OS in C"
    year: 2026
    note: "The first version, in C on ESP-IDF: launcher, Wi-Fi, battery, time and settings. It had stopped before the voice app."
now: "Press a button, speak, and Nexus's agent answers."
---

A Waveshare smartwatch with an ESP32-S3 and a 2-inch AMOLED screen. The idea is a watch that only acts as interface, microphone and speaker: transcription, model, tools and voice live on [Nexus](/en/projects/nexus), and the watch is one of its voice channels.

Push-to-talk instead of a wake word: less battery and no accidental triggers. Audio goes back and forth in Opus over a WebSocket, so the answer can arrive while the model is still generating it.

## How it is built

- The firmware restarted from scratch on Espressif's ESP-Brookesia 0.8, which brings a multi-app launcher, settings, Wi-Fi and audio. I wrote the board definition myself: Brookesia does not include this model.
- The UI has its own design system: text on black, since a black pixel on AMOLED is off, thin lines and a single accent color. Inter with accented letters, a density of 2.0 like commercial smartwatches, and a boot screen with the name. It changes by overriding Brookesia's JSON files, without touching its code.
- The development tools go over USB: screenshots of the pixels sent to the panel, simulated taps, CPU load and touch latency. They let the coding agent see and try the UI without me touching the watch.

## Where it stands

The UI is done and needs a try on the wrist. Next comes power (sleep and wake from the button), then voice end to end with Nexus, then updates over Wi-Fi.
