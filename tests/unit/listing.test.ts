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
	it('di default ordina dal più recente', () => {
		expect(ids(applyFilters(items, DEFAULT_FILTERS, 'en'))).toEqual(['beta', 'gamma', 'alpha']);
	});

	it('filtra per testo, tag e stato insieme', () => {
		expect(ids(applyFilters(items, { ...DEFAULT_FILTERS, query: 'ALP' }, 'en'))).toEqual(['alpha']);
		expect(ids(applyFilters(items, { ...DEFAULT_FILTERS, tags: ['AI'] }, 'en'))).toEqual([
			'beta',
			'alpha'
		]);
		expect(
			ids(applyFilters(items, { ...DEFAULT_FILTERS, tags: ['AI'], statuses: ['completed'] }, 'en'))
		).toEqual(['alpha']);
	});

	it('più valori nello stesso filtro valgono in OR', () => {
		const tags = applyFilters(items, { ...DEFAULT_FILTERS, tags: ['Rust', 'Svelte'] }, 'en');
		expect(ids(tags)).toEqual(['gamma', 'alpha']);
		const statuses = applyFilters(
			items,
			{ ...DEFAULT_FILTERS, statuses: ['idea', 'in-progress'] },
			'en'
		);
		expect(ids(statuses)).toEqual(['beta', 'gamma']);
	});

	it('ordina per data crescente o per titolo', () => {
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

	it('non modifica la lista in ingresso', () => {
		applyFilters(items, { ...DEFAULT_FILTERS, sort: 'title' }, 'en');
		expect(ids(items)).toEqual(['alpha', 'beta', 'gamma']);
	});
});

describe('tagsByFrequency', () => {
	it('per frequenza, poi alfabetico', () => {
		expect(tagsByFrequency(items, 'en')).toEqual(['AI', 'Rust', 'Svelte']);
	});
});

describe('filtri nella query string', () => {
	it('andata e ritorno senza perdite', () => {
		const f = {
			query: 'agent',
			tags: ['AI', 'Rust'],
			statuses: ['idea' as const, 'completed' as const],
			sort: 'title' as const
		};
		expect(filtersFromSearch(searchFromFilters(f))).toEqual(f);
	});

	it('i default non finiscono nella query string', () => {
		expect(searchFromFilters(DEFAULT_FILTERS)).toBe('');
	});

	it('valori sconosciuti, vuoti o ripetuti vengono scartati', () => {
		expect(filtersFromSearch('?status=nope&sort=random&tag=')).toEqual(DEFAULT_FILTERS);
		expect(filtersFromSearch('?tag=AI&tag=AI').tags).toEqual(['AI']);
	});
});
