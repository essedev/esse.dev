---
slug: "milano"
title: "New in Milan"
excerpt: "Since I moved to Milan: a trip planner that picks the right station among all the ones around you, and a map of the neighbourhoods with the numbers."
tags:
  - "React"
  - "MapLibre"
  - "PostGIS"
  - "GTFS"
  - "Python"
  - "Open Data"
---

I moved to Milan in 2026, and two projects came almost right away.

## based-routing

In Milan the same destination can be reached from many stations, with very different arrival times, but Google Maps gives you one route per pair of points. based-routing considers every station you can walk to from where you are and picks the one that gets you there first.

- It imports the timetables of Trenord, ATM and two regional bus networks, about 5 million stop times, and refreshes them when they change.
- It computes the walking legs with OSRM and draws trains on the actual track, with pgRouting on OpenStreetMap's railway network.
- Trenord delays come in live, every 30 seconds.

It is a PWA with 176 tests. The rest of the live data waits for access to the official feeds.

## Milanoz

A map of Milan's 88 official neighbourhoods, clickable, with demographics, incomes, house prices, greenery and heat islands, plus places with their history. It is static: a Python pipeline prepares the data and the frontend reads it, with no backend until one is needed. Every source keeps its own licence apart, so one can be removed in a block without rewriting anything.
