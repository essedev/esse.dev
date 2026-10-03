import { getCollection, type CollectionEntry } from 'astro:content';
import { featured, languageCodes } from './config';
import { orderFeaturedFirst } from './featured';
import type { SlugMap } from './i18n';

/**
 * Unico accesso ai contenuti per pagine ed endpoint. Unisce il meta condiviso di ogni
 * progetto o articolo al suo testo nella lingua richiesta e fa rispettare a build le
 * regole che lo schema da solo non vede: ogni contenuto pubblicato ha il testo in tutte
 * le lingue, ogni testo ha il suo meta, gli slug sono unici per lingua, la vetrina
 * punta a progetti esistenti e pubblicati.
 */

export type ProjectMeta = CollectionEntry<'projects'>['data'];
export type ArticleMeta = CollectionEntry<'articles'>['data'];
export type ProjectStatus = ProjectMeta['status'];

export interface Project {
	id: string;
	lang: string;
	meta: ProjectMeta;
	text: CollectionEntry<'projectTexts'>['data'];
	entry: CollectionEntry<'projectTexts'>;
}

export interface Article {
	id: string;
	lang: string;
	meta: ArticleMeta;
	text: CollectionEntry<'articleTexts'>['data'];
	entry: CollectionEntry<'articleTexts'>;
}

type TextEntry = CollectionEntry<'projectTexts'> | CollectionEntry<'articleTexts'>;

function join<M extends { published: boolean }, E extends TextEntry>(
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
	const published = [...byId.values()].filter((item) => item.meta.published);
	for (const item of published) {
		const missing = languageCodes.filter((l) => !item.texts[l]);
		if (missing.length)
			throw new Error(`${kind}/${item.id}: manca il testo in ${missing.join(', ')}`);
	}
	for (const lang of languageCodes) {
		const seen = new Map<string, string>();
		for (const item of published) {
			const slug = item.texts[lang].data.slug;
			if (seen.has(slug))
				throw new Error(
					`${kind}: slug "${slug}" (${lang}) usato da ${seen.get(slug)} e ${item.id}`
				);
			seen.set(slug, item.id);
		}
	}
	return published;
}

let cache: Promise<{
	projects: ReturnType<typeof join<ProjectMeta, CollectionEntry<'projectTexts'>>>;
	articles: ReturnType<typeof join<ArticleMeta, CollectionEntry<'articleTexts'>>>;
}> | null = null;

function load() {
	cache ??= (async () => {
		const [pm, pt, am, at] = await Promise.all([
			getCollection('projects'),
			getCollection('projectTexts'),
			getCollection('articles'),
			getCollection('articleTexts')
		]);
		const projects = join('projects', pm, pt);
		const articles = join('articles', am, at);
		const publishedIds = new Set(projects.map((p) => p.id));
		for (const id of featured.projects) {
			if (!publishedIds.has(id))
				throw new Error(`featured.json: "${id}" non è un progetto pubblicato`);
		}
		return { projects, articles };
	})();
	return cache;
}

/** Progetti pubblicati in una lingua, dal più recente. */
export async function getProjects(lang: string): Promise<Project[]> {
	const { projects } = await load();
	return projects
		.map((p) => ({ id: p.id, lang, meta: p.meta, text: p.texts[lang].data, entry: p.texts[lang] }))
		.sort(
			(a, b) =>
				b.meta.created.localeCompare(a.meta.created) || a.text.title.localeCompare(b.text.title)
		);
}

/** Articoli pubblicati in una lingua, dal più recente. */
export async function getArticles(lang: string): Promise<Article[]> {
	const { articles } = await load();
	return articles
		.map((a) => ({ id: a.id, lang, meta: a.meta, text: a.texts[lang].data, entry: a.texts[lang] }))
		.sort((a, b) => b.meta.date.localeCompare(a.meta.date));
}

/** Vetrina della home: i featured nell'ordine dato, poi i più recenti, al massimo sei. */
export async function getShowcase(lang: string): Promise<Project[]> {
	const projects = await getProjects(lang);
	return orderFeaturedFirst(projects, featured.projects).slice(0, 6);
}

export async function getSlugMap(): Promise<SlugMap> {
	const { projects, articles } = await load();
	const toMap = (items: { id: string; texts: Record<string, TextEntry> }[]) =>
		Object.fromEntries(
			items.map((item) => [
				item.id,
				Object.fromEntries(Object.entries(item.texts).map(([lang, t]) => [lang, t.data.slug]))
			])
		);
	return { projects: toMap(projects), articles: toMap(articles) };
}

export async function getPage<C extends 'welcome' | 'about' | 'contact'>(
	collection: C,
	lang: string
): Promise<CollectionEntry<C>> {
	const entries = await getCollection(collection);
	const entry = entries.find((e) => e.id === lang);
	if (!entry) throw new Error(`pages/${collection}/${lang}.md mancante`);
	return entry as CollectionEntry<C>;
}
