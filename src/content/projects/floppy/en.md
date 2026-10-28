---
slug: "floppy"
title: "Floppy"
excerpt: "A shared disk for people who edit video on a Mac: in the Finder it is a volume like any other, the files live on S3 and a local cache makes the clips you already touched fast."
tags:
  - "macOS"
  - "JuiceFS"
  - "Tauri"
  - "React"
  - "Python"
  - "FastAPI"
  - "Valkey"
  - "Homebrew"
why: "On macOS JuiceFS would need macFUSE's kernel extension, which means booting every Mac into recovery. Floppy runs it in a small Linux VM and shares the disk to the Mac over SMB: no extensions and no administrator rights."
now: "It updates itself with Homebrew and asks for a single password, kept in the keychain."
---

It comes from what some colleagues needed: they edit video on Macs with CapCut, footage shot mostly on phones, and they want one thing, a disk that shows up in the Finder with the files on it. A plain network disk from the cloud does not hold up: a timeline reads scattered pieces of large files, and every read pays the distance to the datacenter. Streaming filesystems with a local cache solve this, at a price per person. Floppy does the same with open source parts, on the storage you pick.

## How it works

- JuiceFS splits files into blocks on S3 storage (OVH in Milan in the tests) and keeps the ones already read cached on the Mac.
- The metadata lives in a central Valkey, with a replica in each Mac's VM. I wrote a JuiceFS patch that reads from the local replica and writes in a single round trip: listing a folder of 300 files goes from 75 seconds to 0.3.
- A menu bar app, in Tauri, signs you in, shows the team's disks and the space on the Mac, and keeps activity and trash: who renamed or deleted what, and how to undo it.
- A self-hosted control plane with a web interface for invites and per-disk access, and an MCP server through which Claude manages the team and the Mac.

On the first instance a clip never opened reads at 41 MB/s, five times what a 61 Mbps video needs, and a jump in the timeline costs 0.13 seconds on average. There is no price per person: a team pays the storage and one small server for the metadata.

## Where it stands

The app is on Homebrew and updates itself, the team version works end to end on a local stack and the first self-hosted instance is online. The next step is the pilot with the team. It is open source under the MIT license: `brew install --cask essedev/floppy/floppy`.
