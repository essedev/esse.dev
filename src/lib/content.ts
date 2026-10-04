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

export interface MethodEntry {
	id: string;
	lang: string;
	order: number;
	text: CollectionEntry<'methodTexts'>['data'];
	entry: CollectionEntry<'methodTexts'>;
}

export interface NowEntry {
	id: string;
	lang: string;
	date: string;
	/** Il progetto a cui si riferisce, nella stessa lingua. */
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
	// Senza il campo `published` (metodo, adesso) una voce è sempre pubblica.
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
		// Le iterazioni precedenti sono le stesse in ogni lingua: cambia solo la nota.
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

/** Principi del metodo in una lingua, nell'ordine stabilito. */
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

/** Voci di "adesso" in una lingua, dalla più recente, col progetto collegato. */
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

export async function getPage<C extends 'welcome' | 'about' | 'contact'>(
	collection: C,
	lang: string
): Promise<CollectionEntry<C>> {
	const entries = await getCollection(collection);
	const entry = entries.find((e) => e.id === lang);
	if (!entry) throw new Error(`pages/${collection}/${lang}.md mancante`);
	return entry as CollectionEntry<C>;
}
