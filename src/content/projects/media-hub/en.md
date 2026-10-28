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
now: "Video starts while the file is still arriving; the app for the Samsung TV."
---

My home server is a ThinkPad running Ubuntu. Media Hub is the platform on top of it: a home screen that opens several apps, on a single backend. The first one is the media server, which replaced the CasaOS and Jellyfin stack.

- The video starts right away, even when the file is not all on disk yet: ffmpeg remuxes it on the fly to fMP4 for the browser, and once the file is complete playback reads it from there. From Safari and the iPhone it plays in HLS.
- The library has metadata, covers, trailers and external ratings, with series split by season and anime seasons worked out from the air dates. You browse it by year and genre, and a title can keep several versions on disk.
- Downloaded subtitles align themselves by being measured against the audio, can be adjusted by hand to a tenth of a second and carry over to the next episode.
- A Samsung TV app, on Tizen and sideloaded: home by category, detail page, native player with the next episode at the end, and an opening splash instead of a loading screen. Its code comes from the server on every deploy, with no reinstall.
- The server remounts the media disk on its own when it comes back, and reports it in the health check while it is missing.

Python backend with FastAPI and PostgreSQL, React frontend, TV app in React on Tizen's player.
