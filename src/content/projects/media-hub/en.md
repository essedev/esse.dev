---
slug: "media-hub"
title: "Media Hub"
excerpt: "The platform of my home server: a home screen with several apps on one backend, a media server that starts the video while the file is still arriving, and a Samsung TV app."
tags:
  - "Python"
  - "FastAPI"
  - "React"
  - "Tizen"
  - "ffmpeg"
  - "Self-hosted"
why: "The video starts while the file is still arriving: the engine fetches pieces in order, prioritising the ones where you are, and ffmpeg remuxes them on the fly for the browser."
---

My home server is a ThinkPad running Ubuntu. Media Hub is the platform on top of it: a home screen that opens several apps, on a single backend. The first one is the media server, which replaced the CasaOS and Jellyfin stack.

- The video starts right away, even when the file is not all on disk yet: ffmpeg remuxes it on the fly to fMP4 for the browser, and once the file is complete playback reads it from there.
- The library has metadata, covers, subtitles and ratings, with series split by season.
- A Samsung TV app, on Tizen and sideloaded: home by category, detail page and native player. Its code comes from the server on every deploy, with no reinstall.
- On a phone everything works in the browser.

Python backend with FastAPI and PostgreSQL, React frontend, TV app in React on Tizen's player.
