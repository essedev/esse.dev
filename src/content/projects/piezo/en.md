---
slug: "piezo"
title: "piezo"
excerpt: "A modular synth you play in the browser and build together with an agent: modules are wired with cables like hardware, and the agent works on the same patch you are playing."
why: "There is one audio engine, compiled to WebAssembly: it runs in the browser when you play and on the server when an agent asks for a render. What the agent listens to comes out of the same engine you hear."
now: "It is online on my server, with sign-up closed; I am working on multi-track songs, which for now agents write and render with no interface."
---

piezo is a modular synth you play in the browser. The modules are named after objects (Pendolo, Cristallo, Prisma, Respiro: pendulum, crystal, prism, breath) and are wired with cables, like hardware. The part I cared about most is the other one: an agent connected to the synth works on the same patch I have open, while it plays.

## How it works

- Every cable has the colour of the signal it carries: audio, control or gate. Any output can go into any input, and a cable can also end on a knob, to modulate it.
- The audio engine is written in C++ with its blocks in Faust, compiled into a single WebAssembly. The same file runs in the browser and in the backend.
- The agent comes in through an MCP server with OAuth. Each of its changes shows up on the canvas and is heard at once, undoes with Cmd+Z like mine and stays in the history with the name of who made it.
- A moment is a patch played with a sequence of notes: it is recorded from the page, rendered on the server and judged. Every render has an audio fingerprint, so sounds can be searched by description or by similarity; for now only the agent does that.
- You play it with the computer keyboard, and a patch with a clock inside goes on by itself.

## Where it stands

It started on 16 November 2026 and is online on my server, with sign-up closed. The rack holds large generative patches: every parameter can be modulated with a cable, cables carry up to 16 voices and the output is stereo. The next piece is multi-track songs, which today agents write and render without an interface.

The code is private for now. The idea is to open it.
