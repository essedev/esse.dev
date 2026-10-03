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
		link: z.url().optional()
	})
});

const projectTexts = defineCollection({
	loader: glob({ pattern: '*/*.md', base: './src/content/projects', generateId: textId }),
	schema: z.object({
		slug: z.string().min(1),
		title: z.string().min(1),
		excerpt: z.string().min(1),
		tags: z.array(z.string().min(1))
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

// Pagine della home: un file per lingua, l'id è il codice lingua.
const langId = ({ entry }: { entry: string }) => entry.replace(/\.md$/, '');

const welcome = defineCollection({
	loader: glob({ pattern: '*.md', base: './src/content/pages/welcome', generateId: langId }),
	schema: z.object({ eyebrow: z.string().min(1), title: z.string().min(1) })
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

export const collections = {
	projects,
	projectTexts,
	articles,
	articleTexts,
	welcome,
	about,
	contact
};
