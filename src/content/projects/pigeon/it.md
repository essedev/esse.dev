---
slug: "pigeon"
title: "Pigeon"
excerpt: "Invio di email transazionali da template, con un'API e un pannello: la porta HTTP davanti al tuo server SMTP."
tags:
  - "TypeScript"
  - "Fastify"
  - "PostgreSQL"
  - "Docker"
  - "Email"
  - "API"
---

Nei runtime serverless ed edge non si può aprire la connessione TCP che una libreria SMTP si aspetta. Pigeon risolve il problema senza passare da un servizio esterno: l'applicazione chiama la sua API con un template e i dati, e Pigeon spedisce dal server SMTP della casella che hai già, registrando l'esito.

- Progetti con le proprie impostazioni SMTP e il proprio mittente.
- Template HTML con segnaposto sostituiti all'invio, e allegati.
- API autenticata con chiave, pannello per scrivere i template e vedere cosa è partito.

Fastify e TypeScript, PostgreSQL con Drizzle, tutto in Docker. È nato nel 2024 come S-Mail, e oggi spedisce le email dei miei progetti.
