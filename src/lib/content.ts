import { getCollection, type CollectionEntry } from 'astro:content';
import { featured, languageCodes } from './config';
import { orderFeaturedFirst } from './featured';
import type { SlugMap } from './i18n';

/**
 * The only access to content for pages and endpoints. It joins the shared meta of each
 * project or article to its text in the requested language and enforces at build time the
 * rules the schema alone cannot see: every published item has its text in all languages,
 * every text has its meta, slugs are unique per language, the showcase points to existing
 * published projects.
 */

/** The shared fields of a project. */
export type ProjectMeta = CollectionEntry<'projects'>['data'];
/** The shared fields of an article. */
export type ArticleMeta = CollectionEntry<'articles'>['data'];
/** The status of a project. */
export type ProjectStatus = ProjectMeta['status'];
/** The Lucide icon of a generated cover. */
export type CoverIcon = NonNullable<ProjectMeta['icon']>;

/** A project in one language: meta, text and the raw entry. */
export interface Project {
	id: string;
	lang: string;
	meta: ProjectMeta;
	text: CollectionEntry<'projectTexts'>['data'];
	entry: CollectionEntry<'projectTexts'>;
}

/** An article in one language: meta, text and the raw entry. */
export interface Article {
	id: string;
	lang: string;
	meta: ArticleMeta;
	text: CollectionEntry<'articleTexts'>['data'];
	entry: CollectionEntry<'articleTexts'>;
}

/** A method principle in one language. */
export interface MethodEntry {
	id: string;
	lang: string;
	order: number;
	text: CollectionEntry<'methodTexts'>['data'];
	entry: CollectionEntry<'methodTexts'>;
}

/** An entry of the "now" section in one language. */
export interface NowEntry {
	id: string;
	lang: string;
	date: string;
	/** The project it refers to, in the same language. */
	project: Project;
	title: string;
	entry: CollectionEntry<'nowTexts'>;
}

type TextEntry =
	| CollectionEntry<'projectTexts'>
	| CollectionEntry<'articleTexts'>
	| CollectionEntry<'methodTexts'>
	| CollectionEntry<'nowTexts'>;

function join<M extends object, E extends TextEntry>(
	kind: string,
	metas: { id: string; data: M }[],
	texts: E[]
): { id: string; meta: M; texts: Record<string, E> }[] {
	const byId = new Map(
		metas.map((m) => [m.id, { id: m.id, meta: m.data, texts: {} as Record<string, E> }])
	);
	for (const text of texts) {
		const [id, lang] = text.id.split('/');
		const item = byId.get(id);
		if (!item) throw new Error(`${kind}/${id}/${lang}.md senza meta.json`);
		if (!languageCodes.includes(lang))
			throw new Error(`${kind}/${id}/${lang}.md: lingua sconosciuta`);
		item.texts[lang] = text;
	}
	// Without the `published` field (method, now) an entry is always published.
	const published = [...byId.values()].filter(
		(item) => !('published' in item.meta) || item.meta.published !== false
	);
	for (const item of published) {
		const missing = languageCodes.filter((l) => !item.texts[l]);
		if (missing.length)
			throw new Error(`${kind}/${item.id}: manca il testo in ${missing.join(', ')}`);
	}
	for (const lang of languageCodes) {
		const seen = new Map<string, string>();
		for (const item of published) {
			const data = item.texts[lang].data;
			if (!('slug' in data)) continue;
			const slug = data.slug;
			if (seen.has(slug))
				throw new Error(
					`${kind}: slug "${slug}" (${lang}) usato da ${seen.get(slug)} e ${item.id}`
				);
			seen.set(slug, item.id);
		}
	}
	return published;
}

function loadAll() {
	return (async () => {
		const [pm, pt, am, at, mm, mt, nm, nt] = await Promise.all([
			getCollection('projects'),
			getCollection('projectTexts'),
			getCollection('articles'),
			getCollection('articleTexts'),
			getCollection('method'),
			getCollection('methodTexts'),
			getCollection('now'),
			getCollection('nowTexts')
		]);
		const projects = join('projects', pm, pt);
		const articles = join('articles', am, at);
		const method = join('method', mm, mt);
		const now = join('now', nm, nt);
		// The earlier iterations are the same in every language: only the note changes.
		for (const p of projects) {
			const shape = (lang: string) =>
				JSON.stringify((p.texts[lang].data.previously ?? []).map((x) => [x.name, x.year]));
			const [first, ...rest] = languageCodes;
			for (const lang of rest) {
				if (shape(lang) !== shape(first))
					throw new Error(`projects/${p.id}: \`previously\` diverso tra ${first} e ${lang}`);
			}
		}
		const publishedIds = new Set(projects.map((p) => p.id));
		for (const id of featured.projects) {
			if (!publishedIds.has(id))
				throw new Error(`featured.json: "${id}" non è un progetto pubblicato`);
		}
		for (const item of now) {
			if (!publishedIds.has(item.meta.project)) {
				throw new Error(`now/${item.id}: "${item.meta.project}" non è un progetto pubblicato`);
			}
		}
		return { projects, articles, method, now };
	})();
}

let cache: ReturnType<typeof loadAll> | null = null;

function load() {
	cache ??= loadAll();
	return cache;
}

/** Published projects in one language, most recent first. */
export async function getProjects(lang: string): Promise<Project[]> {
	const { projects } = await load();
	return projects
		.map((p) => ({ id: p.id, lang, meta: p.meta, text: p.texts[lang].data, entry: p.texts[lang] }))
		.sort(
			(a, b) =>
				b.meta.created.localeCompare(a.meta.created) || a.text.title.localeCompare(b.text.title)
		);
}

/** Published articles in one language, most recent first. */
export async function getArticles(lang: string): Promise<Article[]> {
	const { articles } = await load();
	return articles
		.map((a) => ({ id: a.id, lang, meta: a.meta, text: a.texts[lang].data, entry: a.texts[lang] }))
		.sort((a, b) => b.meta.date.localeCompare(a.meta.date));
}

/** The home showcase: the featured projects in the given order, then the most recent, at most six. */
export async function getShowcase(lang: string): Promise<Project[]> {
	const projects = await getProjects(lang);
	return orderFeaturedFirst(projects, featured.projects).slice(0, 6);
}

/** The method principles in one language, in their set order. */
export async function getMethod(lang: string): Promise<MethodEntry[]> {
	const { method } = await load();
	return method
		.map((m) => ({
			id: m.id,
			lang,
			order: m.meta.order,
			text: m.texts[lang].data,
			entry: m.texts[lang]
		}))
		.sort((a, b) => a.order - b.order);
}

/** The "now" entries in one language, most recent first, with the linked project. */
export async function getNow(lang: string): Promise<NowEntry[]> {
	const [{ now }, projects] = await Promise.all([load(), getProjects(lang)]);
	const byId = new Map(projects.map((p) => [p.id, p]));
	return now
		.map((n) => ({
			id: n.id,
			lang,
			date: n.meta.date,
			project: byId.get(n.meta.project)!,
			title: n.texts[lang].data.title,
			entry: n.texts[lang]
		}))
		.sort((a, b) => b.date.localeCompare(a.date));
}

/** The slug of every item in every language, for the translation of URLs. */
export async function getSlugMap(): Promise<SlugMap> {
	const { projects, articles, method } = await load();
	const toMap = (items: { id: string; texts: Record<string, TextEntry> }[]) =>
		Object.fromEntries(
			items.map((item) => [
				item.id,
				Object.fromEntries(
					Object.entries(item.texts).map(([lang, t]) => [lang, 'slug' in t.data ? t.data.slug : ''])
				)
			])
		);
	return { projects: toMap(projects), articles: toMap(articles), method: toMap(method) };
}

/** A single page (welcome, about, contact) in one language. */
export async function getPage<C extends 'welcome' | 'about' | 'contact'>(
	collection: C,
	lang: string
): Promise<CollectionEntry<C>> {
	const entries = await getCollection(collection);
	const entry = entries.find((e) => e.id === lang);
	if (!entry) throw new Error(`pages/${collection}/${lang}.md mancante`);
	return entry as CollectionEntry<C>;
}
