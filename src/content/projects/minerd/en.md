---
slug: "minerd"
title: "Minerd"
excerpt: "A mobile mining idle game, already playable in singleplayer, as the base for an idea: a game that updates itself with AI."
tags:
  - "TypeScript"
  - "Phaser"
  - "Fastify"
  - "PostgreSQL"
  - "Game"
---

Minerd is an idle game where you build and run mining rigs: buy hardware, pick what to mine, keep watts and temperatures in check, and earn even with the app closed. Every part is unique, with a silicon lottery that changes its cores, clocks and power draw.

The base is there: singleplayer works, the economy is balanced with one command and there are 412 tests on three levels. TypeScript everywhere, Phaser for the game, Fastify and PostgreSQL behind it. Multiplayer, with the market and attacks between players, is still a shell.

## The idea

An idle game lives on new content: hardware, events, balancing. The idea is that an agent produces it, inside rules and tests that decide what gets in, and that the game updates itself while people play. None of this is in the code yet: for now it is the direction.
