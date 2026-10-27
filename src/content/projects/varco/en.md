---
slug: "varco"
title: "Varco"
excerpt: "A navigator for Milan that knows where your car is allowed in: ZTLs, pedestrian areas, Area B and Area C by vehicle and time of day, and a route that avoids them."
tags:
  - "React"
  - "MapLibre"
  - "Cloudflare Workers"
  - "Hono"
  - "Python"
  - "Valhalla"
  - "PWA"
why: "When in doubt, a zone is closed: a rule not yet transcribed, a time window not found or an expired calendar give \"you can't enter\", never \"free\". The only mistake that costs a fine is saying you can enter when you can't."
---

Driving in Milan, the question is not only how to get there but whether you are allowed in: limited traffic zones (ZTL) with different hours, pedestrian areas, Area B and Area C with rules that depend on fuel, Euro class and exemptions. A navigator takes you inside without asking what car you drive. Varco starts from there: for every zone it says whether you can enter, on what terms and until when, and guides you around the closed ones.

## How it works

- The vehicle is described with the fields of its registration document, plus exemptions and permits (Area C residency, Move-In, disabled badge). It stays on the phone, with no account.
- The rules engine is TypeScript shared by the Worker and the PWA: the "can I enter?" answer works without a network too.
- Every rule cites its source: the City's acts, otherwise the road sign seen on Street View with the photo's date. The zones missing from the City's dataset I redrew on OpenStreetMap's streets.
- Valhalla computes the route and Photon searches addresses, both self-hosted on my server. If the destination is inside a closed zone, the arrival is the nearest reachable point, verified with the router, and the last stretch is on foot.
- Voice navigation, rerouting when you leave the route, stops, and for electric cars the charging points from Italy's national charging platform.

## Where it stands

It is online at [varco.esse.dev](https://varco.esse.dev), at version 1.1, and installs from the browser as an app. Every ZTL in force is transcribed with a source. The next step is the test in a car. Varco is a working name.
