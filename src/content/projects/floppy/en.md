---
slug: "floppy"
title: "Floppy"
excerpt: "A shared disk for people who edit video on a Mac: in the Finder it is a volume like any other, the files live on S3 and a local cache makes the clips you already touched fast."
why: "On macOS JuiceFS would need macFUSE's kernel extension, which means booting every Mac into recovery. Floppy runs it in a small Linux VM and shares the disk to the Mac over SMB: no extensions and no administrator rights."
now: "A first team has used it since late October; I am working on how it behaves with large files in real work."
---

It comes from what a small team needed: they edit video on Macs, footage shot mostly on phones, and they want one thing, a disk that shows up in the Finder with the files on it. A plain network disk from the cloud does not hold up: a timeline reads scattered pieces of large files, and every read pays the distance to the datacenter. Streaming filesystems with a local cache solve this, at a price per person. Floppy does the same with open source parts, on the storage you pick.

## How it works

- JuiceFS splits files into blocks on S3 storage and keeps the ones already read cached on the Mac.
- The metadata lives in a central database, with a replica on each Mac. I wrote a JuiceFS patch that reads from the local replica: listing a folder of 300 files goes from 75 seconds to 0.3.
- A menu bar app signs you in, shows the team's disks and the space on the Mac, and keeps activity and trash: who renamed or deleted what, and how to undo it.
- A self-hosted server with a web interface for invites and per-disk access, and an MCP server through which Claude manages the team and the Mac.

In the measurements a clip never opened reads about five times faster than playing it needs. There is no price per person: a team pays the storage and one small server for the metadata.

## Where it stands

The app is on Homebrew and updates itself. A first team has used it since late October 2026, on a self-hosted instance. In the first weeks they mostly edited on the Mac's own disk and brought the results to Floppy, because large files felt slow: that is the problem I am working on, and the measurements in real work are still to take.

The site is [floppy.esse.dev](https://floppy.esse.dev). The app is open source under the MIT license, the server under the AGPL: `brew install --cask essedev/floppy/floppy`.
