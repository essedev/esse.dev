---
title: "Privacy"
updated: "2026-10-06"
---

This site is mine and I am the one handling the data it collects: Simone Salerno, [hello@esse.dev](mailto:hello@esse.dev). Here is everything that goes through it, why, where it ends up and how long it stays. No cookies, no ads, no profiling.

## Statistics

I count visits with [Umami](https://umami.is), installed on a server of mine in Germany (OVH). It records the page, where you came from, the country, the kind of device and a few actions on the site: a message sent to the agent, a copied link, a link to another site. The text of the messages never ends up there.

Umami uses no cookies and stores nothing on your device. The IP address is not kept: it is used to derive the country and an anonymous identifier, a hash that changes every month, to tell visitors apart without knowing who they are. The data is aggregated and I keep it with no expiry, to compare one year with the next. Legal basis: my legitimate interest in understanding what gets read.

## The agent

When you write to the [agent](/en/agent) I save the conversation: your messages, the answers, the tools used and any message drafts. It lives on Cloudflare and deletes itself **90 days after the last message**. "New conversation" restarts the context but does not delete the earlier conversations, which stay until the same deadline. If you want them deleted sooner, write to me.

To answer, every message goes through:

- **TypeSafe**, which first decides whether the message is on topic;
- **OpenRouter**, which forwards it to the model and the provider running it (today GLM by Z.ai, served by BaseTen, Fireworks or Parasail, in the United States);
- **GitHub**, when the agent searches my public repositories: it receives the search terms the model picks, which may echo your question.

Do not write to the agent anything you would not want a model to read. Legal basis: your request, which the agent answers.

The browser keeps a random identifier (`agent-visitor`) to find your conversation when you come back, and a flag (`agent-started`) to know whether you already started it. They stay on your device until you clear them and are not used to follow you elsewhere.

## Spending limits

Every answer has a cost, and to prevent abuse I count spending per visitor and per IP address. The IP is not stored in the clear: I keep a hash that changes every day and is deleted the day after. Legal basis: the legitimate interest in protecting the service.

## Messages to me

If you send a message through the agent, it reaches me by email with the subject, the text and the contact you choose to leave. Before sending, Cloudflare Turnstile checks that you are not a bot with browser signals. I keep the message in my mailbox for as long as it takes to answer you. Legal basis: your request to get in touch.

## Hosting

The site runs on Cloudflare, which logs requests (IP address, browser, page) to run and protect it, for a few days. Legal basis: the legitimate interest in the site working and being secure.

## Data outside the European Union

Cloudflare, OpenRouter and the model providers are based in the United States. The transfer relies on the EU-US Data Privacy Framework or on the standard contractual clauses provided by each supplier.

## Your rights

You can ask me at any time to see, correct or delete your data, to restrict its use, to object to the processing or to receive it in a readable format: an email to [hello@esse.dev](mailto:hello@esse.dev) is enough. If you think I am mishandling it you can turn to the Italian data protection authority, the [Garante per la protezione dei dati personali](https://www.garanteprivacy.it).

When something changes I update this page and the date at the top.
