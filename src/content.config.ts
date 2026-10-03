import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Ogni progetto e articolo è una cartella: `meta.json` tiene i campi condivisi tra le
// lingue, `<lang>.md` il testo di quella lingua (frontmatter + corpo in Markdown).
// Le due metà sono collection separate e si uniscono in `src/lib/content.ts`.

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'data in formato YYYY-MM-DD');

// L'id di un meta è il nome della cartella; quello di un testo è `<cartella>/<lingua>`.
const folderId = ({ entry }: { entry: string }) => entry.split('/')[0];
const textId = ({ entry }: { entry: string }) => entry.replace(/\.md$/, '');

export const projectStatus = z.enum(['in-progress', 'completed', 'idea', 'archived']);

const projects = defineCollection({
	loader: glob({ pattern: '*/meta.json', base: './src/content/projects', generateId: folderId }),
	schema: z.object({
		status: projectStatus,
		published: z.boolean(),
		created: isoDate,
		updated: isoDate,
		/** Codice pubblico: c'è il repo. Senza, il progetto è privato. */
		repo: z.url().optional(),
		/** Il progetto online, se esiste. */
		site: z.url().optional(),
		license: z.string().optional(),
		/** Comando di installazione da copiare, se il progetto si installa. */
		install: z.string().optional()
	})
});

const projectTexts = defineCollection({
	loader: glob({ pattern: '*/*.md', base: './src/content/projects', generateId: textId }),
	schema: z.object({
		slug: z.string().min(1),
		title: z.string().min(1),
		excerpt: z.string().min(1),
		tags: z.array(z.string().min(1)),
		/** La decisione tecnica interessante, per i progetti in vetrina. */
		why: z.string().min(1).optional()
	})
});

const articles = defineCollection({
	loader: glob({ pattern: '*/meta.json', base: './src/content/articles', generateId: folderId }),
	schema: z.object({
		published: z.boolean(),
		date: isoDate,
		updated: isoDate
	})
});

const articleTexts = defineCollection({
	loader: glob({ pattern: '*/*.md', base: './src/content/articles', generateId: textId }),
	schema: z.object({
		slug: z.string().min(1),
		title: z.string().min(1),
		excerpt: z.string().min(1),
		description: z.string().min(1),
		tags: z.array(z.string().min(1))
	})
});

// Metodo: i principi, uno per cartella, nell'ordine di `order`.
const method = defineCollection({
	loader: glob({ pattern: '*/meta.json', base: './src/content/method', generateId: folderId }),
	schema: z.object({ order: z.number().int().positive() })
});

const methodTexts = defineCollection({
	loader: glob({ pattern: '*/*.md', base: './src/content/method', generateId: textId }),
	schema: z.object({
		slug: z.string().min(1),
		title: z.string().min(1),
		summary: z.string().min(1)
	})
});

// Adesso: voci datate su cosa sto facendo, ognuna legata a un progetto.
const now = defineCollection({
	loader: glob({ pattern: '*/meta.json', base: './src/content/now', generateId: folderId }),
	schema: z.object({ date: isoDate, project: z.string().min(1) })
});

const nowTexts = defineCollection({
	loader: glob({ pattern: '*/*.md', base: './src/content/now', generateId: textId }),
	schema: z.object({ title: z.string().min(1) })
});

// Pagine della home: un file per lingua, l'id è il codice lingua.
const langId = ({ entry }: { entry: string }) => entry.replace(/\.md$/, '');

const welcome = defineCollection({
	loader: glob({ pattern: '*.md', base: './src/content/pages/welcome', generateId: langId }),
	schema: z.object({
		eyebrow: z.string().min(1),
		title: z.string().min(1),
		/** Righe brevi chiave e valore sotto la presentazione. */
		facts: z.array(z.object({ label: z.string().min(1), value: z.string().min(1) })).default([])
	})
});

const about = defineCollection({
	loader: glob({ pattern: '*.md', base: './src/content/pages/about', generateId: langId }),
	schema: z.object({ title: z.string().min(1) })
});

const contact = defineCollection({
	loader: glob({ pattern: '*.md', base: './src/content/pages/contact', generateId: langId }),
	schema: z.object({
		title: z.string().min(1),
		subtitle: z.string().min(1),
		links: z.array(z.object({ name: z.string().min(1), url: z.string().min(1) })).min(1)
	})
});

// Testi del sito per lingua: titolo, descrizione, nomi delle sezioni e stringhe della UI.
// Lo schema è rigido: ogni lingua deve avere tutte le chiavi e nessuna in più, così una
// traduzione mancante ferma la build e le chiavi sono un tipo (`UiKey` in src/lib/site.ts).
const text = z.string().min(1);
const sections = z
	.object({ projects: text, articles: text, method: text, now: text, about: text, agent: text })
	.strict();

const site = defineCollection({
	loader: glob({
		pattern: '*.json',
		base: './src/content/site',
		generateId: ({ entry }) => entry.replace(/\.json$/, '')
	}),
	schema: z
		.object({
			title: text,
			description: text,
			sections,
			/** Descrizione per i motori di ricerca delle pagine di lista. */
			sectionDescriptions: sections,
			ui: z
				.object({
					skipToContent: text,
					language: text,
					home: text,
					backHome: text,
					pageNotFound: text,
					pageNotFoundText: text,
					copied: text,
					copyLink: text,
					linkCopied: text,
					commandCopied: text,
					emailCopied: text,
					keysMove: text,
					keysOpen: text,
					keysBack: text,
					startHere: text,
					featured: text,
					allProjects: text,
					search: text,
					status: text,
					tags: text,
					sort: text,
					statusCompleted: text,
					statusInProgress: text,
					statusIdea: text,
					statusArchived: text,
					sortNewest: text,
					sortOldest: text,
					sortTitle: text,
					noResults: text,
					clearFilters: text,
					searchTags: text,
					noMatches: text,
					clearSelection: text,
					removeFilter: text,
					related: text,
					year: text,
					stack: text,
					private: text,
					repository: text,
					site: text,
					releases: text,
					license: text,
					why: text,
					agentPlaceholder: text,
					agentSend: text,
					agentStop: text,
					agentReset: text,
					agentConnecting: text,
					agentOffline: text,
					agentThinking: text,
					agentToolCall: text,
					agentResult: text,
					agentReasoning: text,
					agentBudget: text,
					agentNoticeOfftopic: text,
					agentNoticeAbuse: text,
					agentNoticeBudget: text,
					agentIntentAbout: text,
					agentIntentCode: text,
					agentIntentOfftopic: text,
					agentIntentAbuse: text,
					agentWeightLight: text,
					agentWeightMedium: text,
					agentWeightHeavy: text,
					agentRetrying: text,
					agentRetry: text,
					agentTools: text,
					agentToolsNote: text,
					agentToolSearch: text,
					agentToolRead: text,
					agentTry: text,
					agentAsk1: text,
					agentAsk2: text,
					agentAsk3: text,
					agentToolsSite: text,
					agentToolsCode: text,
					agentToolsMore: text,
					agentToolProjects: text,
					agentToolShow: text,
					agentToolRepo: text,
					agentToolFiles: text,
					agentToolFile: text,
					agentToolCode: text,
					agentToolCommits: text,
					agentToolRender: text,
					agentToolRun: text,
					agentToolDelegate: text,
					agentSubagents: text,
					agentAnswer: text,
					agentToolDraft: text,
					agentDraft: text,
					agentDraftSubject: text,
					agentDraftContact: text,
					agentDraftSend: text,
					agentDraftSending: text,
					agentDraftSent: text,
					agentOpen: text,
					agentAsk4: text,
					prev: text,
					next: text
				})
				.strict()
		})
		.strict()
});

export const collections = {
	projects,
	projectTexts,
	articles,
	articleTexts,
	method,
	methodTexts,
	now,
	nowTexts,
	welcome,
	about,
	contact,
	site
};
