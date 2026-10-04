---
slug: "zeno"
title: "Zeno"
excerpt: "A web agency made of agents for Italian local businesses: it finds the ones without a website, builds them a real demo and handles the sale, publishing and support."
tags:
  - "AI Agents"
  - "Astro"
  - "Cloudflare Workers"
  - "Python"
  - "FastAPI"
why: "Every piece of content declares in the schema where it comes from: business registry, derived, sample content or customer. In development samples show, in production they fail the build: a site cannot go live with made-up text."
---

Many local businesses have no website, or a broken one. Zeno is a system of agents that finds them, generates a demo of their site from their own data and, if the owner approves it, handles the rest: payment, publishing, hosting, changes and support. The demo is the pitch. Zeno always says it is automated; I am the guarantor and step in only on deals, approvals and blockers.

## Where it is

There is the site engine, three complete demos of the same test business, Zeno's own website and a simulated customer area that walks the whole loop: request, clarification, preview, revision, approval. The conversation with a real model, the portal and the service automation are the next milestone.

## How it is built

- A site is a folder made of business registry data, derived areas and a content pack for its sector; `pnpm zeno new` creates one from a registry record.
- There is one engine, in Astro: same components, different data for each site.
- A single Cloudflare Worker serves every site, resolving the hostname and reading the build from R2. Publishing means uploading a file and updating a map, with no project per customer.
