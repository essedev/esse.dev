---
slug: "budokan"
title: "Bu Do Kan Sports Club"
excerpt: "Website for the Bu Do Kan sports club: classes, schedules, instructors and trial lesson requests, with a custom panel where the gym manages content and requests."
tags:
  - "Next.js"
  - "Cloudflare Workers"
  - "D1"
  - "CMS"
  - "CRM"
  - "Sport"
previously:
  - name: "Bu Do Kan su SvelteKit"
    year: 2024
    note: "The first version: SvelteKit on Cloudflare Pages, with Sanity as the headless CMS. In 2026 the site moved to Next.js and the Sanity content was migrated into the panel's database."
---

The website of the Bu Do Kan sports club: karate, dance, yoga, gymnastics. The gym updates classes, schedules, staff, events and the gallery on its own from a custom panel, and anyone who wants to try a discipline asks for a free lesson straight from the site.

## The panel

- Content: classes, locations and schedules, staff, blog, notices, events, gallery and the home page with its featured announcement. Every change has its history, and whatever gets deleted goes through the trash.
- Requests: trial lessons and contacts land in a small CRM, with statuses, notes, a history of changes and CSV export. People who call or walk into the gym are added by hand.

## How it is built

Next.js 16 on Cloudflare Workers with OpenNext, data on D1 with Drizzle and media on R2. Emails go out through [Pigeon](/en/projects/pigeon) and the forms are protected by Turnstile. Every push to `main` applies the migrations, deploys and checks the public pages.
