import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Every project and article is a folder: `meta.json` holds the fields shared across
// languages, `<lang>.md` the text in that language (frontmatter + Markdown body). The two
// halves are separate collections and are joined in `src/lib/content.ts`.

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'data in formato YYYY-MM-DD');

// The id of a meta is the folder name; that of a text is `<folder>/<language>`.
const folderId = ({ entry }: { entry: string }) => entry.split('/')[0];
const textId = ({ entry }: { entry: string }) => entry.replace(/\.md$/, '');

export const projectStatus = z.enum(['in-progress', 'maintained', 'completed', 'idea', 'archived']);

/** The icons a generated cover can use: a closed set, so each one is a static import. */
export const coverIcon = z.enum([
	'box',
	'plug',
	'brain',
	'server',
	'radio',
	'terminal',
	'database'
]);

const projects = defineCollection({
	loader: glob({ pattern: '*/meta.json', base: './src/content/projects', generateId: folderId }),
	schema: ({ image }) =>
		z.object({
			status: projectStatus,
			published: z.boolean(),
			created: isoDate,
			updated: isoDate,
			/** Public code: the repo. Without it the project is private. */
			repo: z.url().optional(),
			/** The project online, if it exists. */
			site: z.url().optional(),
			license: z.string().optional(),
			/** Install command to copy, if the project is installable. */
			install: z.string().optional(),
			/** The project's own logo, a file in its folder: content, not a UI icon. */
			logo: image().optional(),
			/**
			 * The image the page opens with, a screenshot or a designed mockup, cropped to 21:9
			 * (16:9 on mobile) around `focus`. Without it the cover is generated from `icon`.
			 */
			cover: z
				.object({ src: image(), focus: z.enum(['top', 'center', 'bottom']).default('center') })
				.optional(),
			/** The Lucide icon of the generated cover and of the list row, when there is no logo. */
			icon: coverIcon.optional()
		})
});

const projectTexts = defineCollection({
	loader: glob({ pattern: '*/*.md', base: './src/content/projects', generateId: textId }),
	schema: z.object({
		slug: z.string().min(1),
		title: z.string().min(1),
		excerpt: z.string().min(1),
		tags: z.array(z.string().min(1)),
		/** The interesting technical decision, for showcase projects. */
		why: z.string().min(1).optional(),
		/**
		 * The earlier iterations of the idea, oldest first: abandoned ones too, for
		 * transparency (docs/features/progetti.md). Name and year are the same in every
		 * language, the note is translated; `src/lib/content.ts` checks it.
		 */
		previously: z
			.array(
				z.object({
					name: z.string().min(1),
					year: z.number().int().min(2015).max(2100),
					note: z.string().min(1)
				})
			)
			.optional()
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

// Method: the principles, one per folder, in the order of `order`.
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

// Now: dated entries about what I am doing, each tied to a project.
const now = defineCollection({
	loader: glob({ pattern: '*/meta.json', base: './src/content/now', generateId: folderId }),
	schema: z.object({ date: isoDate, project: z.string().min(1) })
});

const nowTexts = defineCollection({
	loader: glob({ pattern: '*/*.md', base: './src/content/now', generateId: textId }),
	schema: z.object({ title: z.string().min(1) })
});

// Home pages: one file per language, the id is the language code.
const langId = ({ entry }: { entry: string }) => entry.replace(/\.md$/, '');

const welcome = defineCollection({
	loader: glob({ pattern: '*.md', base: './src/content/pages/welcome', generateId: langId }),
	schema: z.object({
		eyebrow: z.string().min(1),
		title: z.string().min(1),
		/** Short key and value rows under the introduction. */
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

// Site texts per language: title, description, section names and UI strings. The schema is
// strict: every language must have all the keys and no extra ones, so a missing translation
// stops the build and the keys are a type (`UiKey` in src/lib/site.ts).
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
			/** Description for search engines, for the list pages. */
			sectionDescriptions: sections,
			ui: z
				.object({
					skipToContent: text,
					language: text,
					home: text,
					welcome: text,
					contacts: text,
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
					openIndex: text,
					close: text,
					status: text,
					tags: text,
					sort: text,
					statusCompleted: text,
					statusInProgress: text,
					statusMaintained: text,
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
					previously: text,
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
					agentCredit: text,
					agentCredits: text,
					agentNoticeOfftopic: text,
					agentNoticeAbuse: text,
					agentNoticeBudget: text,
					agentNoticeRate: text,
					agentIntentAbout: text,
					agentIntentCode: text,
					agentIntentChat: text,
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
