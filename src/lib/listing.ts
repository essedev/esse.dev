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

/** Più tag o più stati selezionati valgono in OR: basta che l'item ne abbia uno. */
export interface Filters {
	query: string;
	tags: string[];
	statuses: Status[];
	sort: SortKey;
}

export const DEFAULT_FILTERS: Filters = { query: '', tags: [], statuses: [], sort: 'newest' };

export const STATUS_ORDER: Status[] = ['in-progress', 'completed', 'idea', 'archived'];

const SORTS: SortKey[] = ['newest', 'oldest', 'title'];

export function applyFilters(items: ListItem[], f: Filters, locale: string): ListItem[] {
	const q = f.query.trim().toLocaleLowerCase(locale);
	const filtered = items.filter(
		(item) =>
			(!q ||
				`${item.title} ${item.excerpt} ${item.tags.join(' ')}`
					.toLocaleLowerCase(locale)
					.includes(q)) &&
			(!f.tags.length || item.tags.some((t) => f.tags.includes(t))) &&
			(!f.statuses.length || (!!item.status && f.statuses.includes(item.status)))
	);
	const byDate = (a: ListItem, b: ListItem) => b.date.localeCompare(a.date);
	if (f.sort === 'oldest') return filtered.sort((a, b) => byDate(b, a));
	if (f.sort === 'title') return filtered.sort((a, b) => a.title.localeCompare(b.title, locale));
	return filtered.sort(byDate);
}

/** Tag presenti nella lista, ordinati per frequenza e poi alfabeticamente. */
export function tagsByFrequency(items: ListItem[], locale: string): string[] {
	return [...countBy(items, 'tags').entries()]
		.sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], locale))
		.map(([tag]) => tag);
}

/** Quanti item per ogni valore (tag o stato), per mostrare i conteggi nelle opzioni. */
export function countBy(items: ListItem[], key: 'tags' | 'status'): Map<string, number> {
	const counts = new Map<string, number>();
	for (const item of items) {
		const values = key === 'tags' ? item.tags : item.status ? [item.status] : [];
		for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
	}
	return counts;
}

/**
 * Filtri dalla query string (`?q=&tag=a&tag=b&status=idea&sort=title`). Valori ripetuti
 * per le selezioni multiple; valori sconosciuti, vuoti o duplicati vengono scartati.
 */
export function filtersFromSearch(search: string): Filters {
	const params = new URLSearchParams(search);
	const sort = params.get('sort') as SortKey | null;
	const unique = <T>(values: T[]) => [...new Set(values)];
	return {
		query: params.get('q') ?? '',
		tags: unique(params.getAll('tag').filter(Boolean)),
		statuses: unique(
			params.getAll('status').filter((s): s is Status => STATUS_ORDER.includes(s as Status))
		),
		sort: sort && SORTS.includes(sort) ? sort : 'newest'
	};
}

/** Query string dai filtri, senza i valori di default (stringa vuota se tutto è default). */
export function searchFromFilters(f: Filters): string {
	const params = new URLSearchParams();
	if (f.query.trim()) params.set('q', f.query.trim());
	for (const tag of f.tags) params.append('tag', tag);
	for (const status of f.statuses) params.append('status', status);
	if (f.sort !== 'newest') params.set('sort', f.sort);
	const s = params.toString();
	return s ? `?${s}` : '';
}
