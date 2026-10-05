import { describe, expect, it } from 'vitest';
import {
	applyFilters,
	DEFAULT_FILTERS,
	filtersFromSearch,
	searchFromFilters,
	tagsByFrequency,
	type ListItem
} from '../../src/lib/listing';

const item = (id: string, date: string, tags: string[], status?: ListItem['status']): ListItem => ({
	id,
	href: `/en/projects/${id}`,
	title: id.toUpperCase(),
	excerpt: `about ${id}`,
	tags,
	date,
	dateLabel: date,
	status
});

const items = [
	item('alpha', '2024-01-01', ['Svelte', 'AI'], 'completed'),
	item('beta', '2026-01-01', ['AI'], 'in-progress'),
	item('gamma', '2025-01-01', ['Rust'], 'idea')
];
const ids = (list: ListItem[]) => list.map((i) => i.id);

describe('applyFilters', () => {
	it('sorts by most recent by default', () => {
		expect(ids(applyFilters(items, DEFAULT_FILTERS, 'en'))).toEqual(['beta', 'gamma', 'alpha']);
	});

	it('filters by text, tag and status together', () => {
		expect(ids(applyFilters(items, { ...DEFAULT_FILTERS, query: 'ALP' }, 'en'))).toEqual(['alpha']);
		expect(ids(applyFilters(items, { ...DEFAULT_FILTERS, tags: ['AI'] }, 'en'))).toEqual([
			'beta',
			'alpha'
		]);
		expect(
			ids(applyFilters(items, { ...DEFAULT_FILTERS, tags: ['AI'], statuses: ['completed'] }, 'en'))
		).toEqual(['alpha']);
	});

	it('combines several values of one filter with OR', () => {
		const tags = applyFilters(items, { ...DEFAULT_FILTERS, tags: ['Rust', 'Svelte'] }, 'en');
		expect(ids(tags)).toEqual(['gamma', 'alpha']);
		const statuses = applyFilters(
			items,
			{ ...DEFAULT_FILTERS, statuses: ['idea', 'in-progress'] },
			'en'
		);
		expect(ids(statuses)).toEqual(['beta', 'gamma']);
	});

	it('searches the tags too, like the list', () => {
		expect(ids(applyFilters(items, { ...DEFAULT_FILTERS, query: 'rust' }, 'en'))).toEqual([
			'gamma'
		]);
	});

	it('sorts by ascending date or by title', () => {
		expect(ids(applyFilters(items, { ...DEFAULT_FILTERS, sort: 'oldest' }, 'en'))).toEqual([
			'alpha',
			'gamma',
			'beta'
		]);
		expect(ids(applyFilters(items, { ...DEFAULT_FILTERS, sort: 'title' }, 'en'))).toEqual([
			'alpha',
			'beta',
			'gamma'
		]);
	});

	it('does not mutate the input list', () => {
		applyFilters(items, { ...DEFAULT_FILTERS, sort: 'title' }, 'en');
		expect(ids(items)).toEqual(['alpha', 'beta', 'gamma']);
	});
});

describe('tagsByFrequency', () => {
	it('orders by frequency, then alphabetically', () => {
		expect(tagsByFrequency(items, 'en')).toEqual(['AI', 'Rust', 'Svelte']);
	});
});

describe('filters in the query string', () => {
	it('round-trips without loss', () => {
		const f = {
			query: 'agent',
			tags: ['AI', 'Rust'],
			statuses: ['idea' as const, 'completed' as const],
			sort: 'title' as const
		};
		expect(filtersFromSearch(searchFromFilters(f))).toEqual(f);
	});

	it('keeps defaults out of the query string', () => {
		expect(searchFromFilters(DEFAULT_FILTERS)).toBe('');
	});

	it('drops unknown, empty or repeated values', () => {
		expect(filtersFromSearch('?status=nope&sort=random&tag=')).toEqual(DEFAULT_FILTERS);
		expect(filtersFromSearch('?tag=AI&tag=AI').tags).toEqual(['AI']);
	});
});
