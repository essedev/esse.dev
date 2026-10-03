/**
 * Dati serializzabili per card, righe e filtri delle liste. Le pagine li costruiscono a
 * build; i componenti Svelte li usano sia renderizzati statici (home) sia come isola
 * interattiva (listing con filtri). Il filtro è puro e testabile.
 */

export type Status = 'in-progress' | 'completed' | 'idea' | 'archived';

export interface ListItem {
	id: string;
	href: string;
	title: string;
	excerpt: string;
	tags: string[];
	/** Data ISO usata per l'ordinamento (creazione per i progetti, pubblicazione per gli articoli). */
	date: string;
	/** Data già formattata nella lingua della pagina. */
	dateLabel: string;
	status?: Status;
	statusLabel?: string;
}

export type SortKey = 'newest' | 'oldest' | 'title';

export interface Filters {
	query: string;
	tag: string | null;
	status: Status | null;
	sort: SortKey;
}

export const DEFAULT_FILTERS: Filters = { query: '', tag: null, status: null, sort: 'newest' };

const SORTS: SortKey[] = ['newest', 'oldest', 'title'];
const STATUSES: Status[] = ['in-progress', 'completed', 'idea', 'archived'];

export function applyFilters(items: ListItem[], f: Filters, locale: string): ListItem[] {
	const q = f.query.trim().toLocaleLowerCase(locale);
	const filtered = items.filter(
		(item) =>
			(!q || `${item.title} ${item.excerpt}`.toLocaleLowerCase(locale).includes(q)) &&
			(!f.tag || item.tags.includes(f.tag)) &&
			(!f.status || item.status === f.status)
	);
	const byDate = (a: ListItem, b: ListItem) => b.date.localeCompare(a.date);
	if (f.sort === 'oldest') return filtered.sort((a, b) => byDate(b, a));
	if (f.sort === 'title') return filtered.sort((a, b) => a.title.localeCompare(b.title, locale));
	return filtered.sort(byDate);
}

/** Tag presenti nella lista, ordinati per frequenza e poi alfabeticamente. */
export function tagsByFrequency(items: ListItem[], locale: string): string[] {
	const counts = new Map<string, number>();
	for (const item of items)
		for (const tag of item.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
	return [...counts.entries()]
		.sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], locale))
		.map(([tag]) => tag);
}

/** Filtri dalla query string; valori sconosciuti o vuoti tornano al default. */
export function filtersFromSearch(search: string): Filters {
	const params = new URLSearchParams(search);
	const sort = params.get('sort') as SortKey | null;
	const status = params.get('status') as Status | null;
	return {
		query: params.get('q') ?? '',
		tag: params.get('tag') || null,
		status: status && STATUSES.includes(status) ? status : null,
		sort: sort && SORTS.includes(sort) ? sort : 'newest'
	};
}

/** Query string dai filtri, senza i valori di default (stringa vuota se tutto è default). */
export function searchFromFilters(f: Filters): string {
	const params = new URLSearchParams();
	if (f.query.trim()) params.set('q', f.query.trim());
	if (f.tag) params.set('tag', f.tag);
	if (f.status) params.set('status', f.status);
	if (f.sort !== 'newest') params.set('sort', f.sort);
	const s = params.toString();
	return s ? `?${s}` : '';
}
