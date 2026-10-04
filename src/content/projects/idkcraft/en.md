---
slug: "idkcraft"
title: "IDKCraft"
excerpt: "A Minecraft-style voxel game in Kotlin and OpenGL, with multiplayer, machines and live updates: 209 commits in two days. Plus a studio that generates its pixel art textures."
tags:
  - "Kotlin"
  - "OpenGL"
  - "LWJGL"
  - "Game"
  - "Multiplayer"
  - "AI"
why: "The game updates while you play: singleplayer is a client connected to a local server, so on every build the server restarts, reloads the world and clients update themselves."
---

IDKCraft is the hardest test I ran on how fast you can build with AI: 209 commits in two days, in March 2026, for a voxel game in Kotlin with LWJGL and OpenGL, playable and shippable as a JAR.

## What is in it

- An infinite procedural world with 8 biomes, caves, dungeons, sky and block light and a day and night cycle.
- 84 blocks and items, 36 recipes, 7 mobs with A* pathfinding and 7 machines with an energy and pipe network, modelled on the tech mods.
- Multiplayer with server-side physics and client prediction; singleplayer is the same code with a local server.
- Live update: I change the code, build, the game restarts by itself, reloads the world and I keep playing. In multiplayer every client updates.
- 471 tests.

## The textures

Blocks need drawing. IDKCraft Studio is the tool next to the game: it generates 16x16 pixel art textures with image models, using reference images to keep one style, snaps them to the grid and palette, and shows them on a 3D block viewer before exporting. There is also an editor to touch them up by hand. Loading them into the game's atlas automatically is the missing step.
