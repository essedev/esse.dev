---
slug: "architecture"
title: "Architecture before code"
summary: "Data, boundaries and standards are decided before the first line."
quote: "An agent that knows where it is working makes *far fewer* mistakes."
proofs:
  - project: "nexus"
    note: "One engine: a schema gives storage, API, the assistant's tools and the interface."
  - project: "zeno"
    note: "One Astro engine and one Worker for every site: publishing means uploading a file."
  - url: "https://github.com/essedev/esse.dev/blob/main/docs/DECISIONS.md"
    title: "This site"
    note: "The numbered decisions, with the rejected alternatives, in the public repo."
---

Then execution speeds up, and an agent that knows where it is working makes far fewer mistakes.

That is why a project starts from a data model and from documents that say where one part ends and the next begins. The code comes after, and it is the part the agent does better than me.
