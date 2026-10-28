/**
 * Serializable data for cards, rows and list filters. Pages build them at build time;
 * Svelte components use them both statically rendered (home) and as an interactive island
 * (listing with filters). The filter is pure and testable.
 */

/** The status of a list item. */
export type Status = 'in-progress' | 'maintained' | 'completed' | 'idea' | 'archived';

/** An image already resolved at build time: the island only places it. */
export interface Picture {
	src: string;
	srcset?: string;
}

/** An image with its light-theme variant, when it has one. */
export interface ThemedPicture {
	dark: Picture;
	light?: Picture;
}

/** One row or card of a list. */
export interface ListItem {
	id: string;
	href: string;
	title: string;
	excerpt: string;
	tags: string[];
	/** ISO date used for sorting (creation for projects, publication for articles). */
	date: string;
	/** The date already formatted in the page language. */
	dateLabel: string;
	status?: Status;
	statusLabel?: string;
	/** The position in the showcase (`featured.json`): first in its group, with a badge. */
	featured?: number;
	/** The project's logo, 20 px with the LED in its corner. */
	logo?: ThemedPicture;
	/** The project's cover, with the part to keep when it is cropped. */
	cover?: ThemedPicture & { focus: 'top' | 'center' | 'bottom' };
}

/** How the rows of a group are drawn: large with the cover, or compact on one line. */
export type GroupKind = 'wide' | 'compact';

/** A section of a grouped list: the statuses it collects and how it draws them. */
export interface Group {
	key: string;
	title: string;
	statuses: Status[];
	kind: GroupKind;
}

/** A group with the items that passed the filters. */
export interface FilledGroup extends Group {
	items: ListItem[];
}

/** How a list is sorted. */
export type SortKey = 'newest' | 'oldest' | 'title';

/** Several selected tags or statuses combine with OR: an item needs only one of them. */
export interface Filters {
	query: string;
	tags: string[];
	statuses: Status[];
	sort: SortKey;
}

/** The filters of an untouched list. */
export const DEFAULT_FILTERS: Filters = { query: '', tags: [], statuses: [], sort: 'newest' };

/** The order in which statuses are offered. */
export const STATUS_ORDER: Status[] = [
	'in-progress',
	'maintained',
	'completed',
	'idea',
	'archived'
];

const SORTS: SortKey[] = ['newest', 'oldest', 'title'];

/** The items that pass the filters, sorted. */
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

/**
 * The filtered items split into groups by status, empty groups dropped. With the default
 * order the featured items come first in their group, in the showcase order; an explicit order is followed as is.
 */
export function groupByStatus(items: ListItem[], groups: Group[], sort: SortKey): FilledGroup[] {
	return groups
		.map((group) => {
			const inGroup = items.filter((item) => !!item.status && group.statuses.includes(item.status));
			const showcase = inGroup
				.filter((i) => i.featured !== undefined)
				.sort((a, b) => a.featured! - b.featured!);
			const ordered =
				sort === DEFAULT_FILTERS.sort
					? [...showcase, ...inGroup.filter((i) => i.featured === undefined)]
					: inGroup;
			return { ...group, items: ordered };
		})
		.filter((group) => group.items.length > 0);
}

/** The tags in the list, ordered by frequency and then alphabetically. */
export function tagsByFrequency(items: ListItem[], locale: string): string[] {
	return [...countBy(items, 'tags').entries()]
		.sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], locale))
		.map(([tag]) => tag);
}

/** How many items per value (tag or status), to show the counts in the options. */
export function countBy(items: ListItem[], key: 'tags' | 'status'): Map<string, number> {
	const counts = new Map<string, number>();
	for (const item of items) {
		const values = key === 'tags' ? item.tags : item.status ? [item.status] : [];
		for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
	}
	return counts;
}

/**
 * Filters from the query string (`?q=&tag=a&tag=b&status=idea&sort=title`). Repeated values
 * for multiple selections; unknown, empty or duplicate values are dropped.
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

/** The query string for the filters, without default values (empty string if all default). */
export function searchFromFilters(f: Filters): string {
	const params = new URLSearchParams();
	if (f.query.trim()) params.set('q', f.query.trim());
	for (const tag of f.tags) params.append('tag', tag);
	for (const status of f.statuses) params.append('status', status);
	if (f.sort !== 'newest') params.set('sort', f.sort);
	const s = params.toString();
	return s ? `?${s}` : '';
}
