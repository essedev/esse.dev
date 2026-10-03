---
slug: "pigeon"
title: "Pigeon"
excerpt: "Transactional email from templates, with an API and an admin panel: the HTTP door in front of your own SMTP server."
tags:
  - "TypeScript"
  - "Fastify"
  - "PostgreSQL"
  - "Docker"
  - "Email"
  - "API"
---

Serverless and edge runtimes cannot open the TCP connection an SMTP library expects. Pigeon solves that without going through an external service: the application calls its API with a template and the data, and Pigeon sends through the SMTP server of the mailbox you already have, recording the outcome.

- Projects with their own SMTP settings and sender.
- HTML templates with placeholders filled in at send time, plus attachments.
- A key-authenticated API, and a panel to write templates and see what went out.

Fastify and TypeScript, PostgreSQL with Drizzle, all in Docker. It started in 2024 as S-Mail, and today it sends the email for my projects.
