---
slug: "motio"
title: "Motio"
excerpt: "An open source framework for making videos by writing React components: every frame is rendered in a real headless Chrome and encoded with FFmpeg, with an API compatible with Remotion's."
why: "Compatibility with Remotion is something I measure: pure functions have to give the same results as the published package, and the same frame has to give the same pixels in any order. The thresholds are part of the contract: changing one is a written decision."
now: "It is in pre-alpha and can be tried from a clone; next comes the release on npm."
---

I make the videos of my projects with Motio: a video is a React component, and time is the frame number. Motio renders the React tree one frame at a time in a real headless Chrome and encodes it with FFmpeg. Its public API is compatible with Remotion's documented one, so an existing project moves over by changing its imports. The license is Apache-2.0: no cost per render or per seat.

## How it works

- They are Chrome's pixels: CSS and layout are not reimplemented. If it looks right in Chrome, the render is the same.
- Determinism is verified: the same project, the same props and the same frame give the same pixels in any order, checked on the hashes of the decoded frames. That is what lets frames render in parallel, across several browser tabs.
- It is built to be used by an agent: every command has JSON output and errors have stable codes. There are stills, contact sheets and flicker checks, so whoever writes the video can also look at what came out.
- Motio's own launch video is made with Motio, music included, synthesised from code. The teaser of [Floppy](/en/projects/floppy) comes from there too.

## Where it stands

It started on 22 November 2026 and is in pre-alpha: nothing is on npm yet and it is tried from a clone of the repo. In four days it got rendering, compatibility with the most used packages, audio and video, the Player and the CLI, with every decision written down and the thresholds of every milestone in the roadmap. Now I am trying it on real projects.

In the repo's benchmark, on my Mac, the same compositions come out 1.2 to 3.7 times faster than with Remotion, depending on how many browser tabs work in parallel. The method and the script are in the repo.

Site and guide are on [motio.esse.dev](https://motio.esse.dev). Motio is an independent project, not affiliated with Remotion.
