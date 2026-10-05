# Conventions

Rules the code and the docs already follow. Read them before writing, and flag code that
breaks them. Commands, gotchas and the design system rules live in `CLAUDE.md`; the why
behind the choices in `docs/ARCHITECTURE.md` and `docs/DECISIONS.md`.

## Language

This is a public repository: prose is in English, the Italian that remains is the product.

| Level                                                                                                    | Language                                                        |
| -------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| Identifiers, file names, branches                                                                        | English                                                         |
| Code comments, doc comments, test names                                                                  | English                                                         |
| `README.md`                                                                                              | English, canonical                                              |
| `README.it.md`                                                                                           | Italian, translation of `README.md`, updated in the same commit |
| `docs/*` (except the archive), `CLAUDE.md`                                                               | English                                                         |
| New commit messages                                                                                      | English, Conventional Commits                                   |
| UI strings and content per language (`src/content/**/it.md`, `src/content/site/it.json`)                 | the language of the content                                     |
| Route names that are Italian UI labels (`progetti`, `scritti`, `adesso`, `chi-sono`, `agente`, `metodo`) | stay as they are                                                |
| `docs/archive/`, git history                                                                             | stay as they are                                                |
| Mockups in `docs/concepts/`                                                                              | the language of the UI they show                                |

Exceptions to the check are declared in `.prose-allow`, each with its reason. The rules for
comments are the same everywhere: a module header on every logic file, a doc comment on
every export of a logic module, inline comments only for the why.

Form rules apply in every language: no em dash, no section sign, no decorative separators,
no emoji, "Yellow Tech" never abbreviated. Italian UI text uses real accents, never an
apostrophe in their place.

## Glossary

The English rendering of the Italian domain terms that recur in the docs, comments and UI.
Translations use only these. A term that is also an Italian UI label stays as it is, and
the table says so.

| Italian                                 | English      | Note                                                    |
| --------------------------------------- | ------------ | ------------------------------------------------------- |
| vetrina                                 | showcase     | `src/config/featured.json`; UI label "in evidenza"      |
| registro                                | registry     | The page that lists every project of a section          |
| scheda (progetto, articolo)             | entry        | A project or an article as content                      |
| scheda (nella trascrizione dell'agente) | card         | What `show_page` and `draft_message` render             |
| spazio di lavoro                        | workspace    | `Workspace.astro`                                       |
| riquadro                                | pane         | The content pane next to the list, `data-pane-glass`    |
| lista                                   | list         | The left column of the workspace                        |
| telaio                                  | chassis      | `Chassis.svelte`, from the discarded restyle            |
| cassetto                                | drawer       | The mobile list, `data-drawer`                          |
| vetro                                   | glass        | `glass` utility, `--glass-*`                            |
| velo                                    | veil         | CRT veil (`--crt-*`), wallpaper veil (`--wall`)         |
| sfondo                                  | wallpaper    |                                                         |
| ciclo                                   | cycle        | Numbering is fixed: "Cycle 22"                          |
| Aperte (ROADMAP)                        | Open         | Section title: the anchor is `#open`                    |
| scritti                                 | writing      | Route `scritti` stays in Italian                        |
| metodo                                  | method       | Route `metodo` stays in Italian                         |
| progetti                                | projects     | Route `progetti` stays in Italian                       |
| `Il perché`                             | Why          | UI label of the `why` field, in Italian                 |
| `Prima di questo`                       | Before this  | UI label of the `previously` field                      |
| chiacchiera                             | chat         | The `chat` intent of Jev                                |
| fuori tema                              | off-topic    |                                                         |
| abuso                                   | abuse        |                                                         |
| raffica                                 | burst        | Per-IP burst limit                                      |
| tetto                                   | cap          | Spending or token cap                                   |
| impronta                                | fingerprint  | Daily SHA-256 of IP and day                             |
| bozza                                   | draft        | `draft_message`                                         |
| sotto-agente                            | sub-agent    | `delegate`                                              |
| agente, Jev                             | agent, Jev   | Jev is the proper name of the triage, it stays          |
| ricerca                                 | search       |                                                         |
| sommario                                | excerpt      | The `excerpt` frontmatter field                         |
| gate                                    | quality gate | `pnpm lint && pnpm check && pnpm build && pnpm test:ci` |

## Code

- Formatting is Prettier: tabs, 100 columns, single quotes, no trailing comma.
- TypeScript strict. Pure logic goes in modules under `src/lib/` or `src/agent/` with no
  Astro or Worker dependency, so Vitest can test it in Node.
- A new content field is added once, in `src/content.config.ts`; types come from
  `CollectionEntry`. A new UI string is added to the `site` schema and to every language.
- Visual values are tokens in `@theme` (`src/styles/global.css`); a hand-written value in
  a component is a mistake.
- Tests describe behavior in English: `it('strips the syntax and keeps the text')`.
- Conventional Commits in English, atomic. The quality gate runs before every push.
