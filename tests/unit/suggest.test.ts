import { describe, expect, it } from 'vitest';
import { distance, searchWords, suggestPages, type PageRef } from '../../src/lib/suggest';

const pages: PageRef[] = [
	{ path: '/it/progetti', title: 'Progetti', kind: 'section' },
	{ path: '/it/scritti', title: 'Scritti', kind: 'section' },
	{ path: '/it/agente', title: 'Agente', kind: 'section' },
	{ path: '/it/progetti/portsage', title: 'Portsage', kind: 'projects', parent: '/it/progetti' },
	{ path: '/it/progetti/relay', title: 'Relay', kind: 'projects', parent: '/it/progetti' },
	{
		path: '/it/scritti/agenti-in-parallelo',
		title: 'Agenti in parallelo',
		kind: 'articles',
		parent: '/it/scritti'
	}
];
const paths = (wanted: string) => suggestPages(wanted, pages).map((p) => p.path);

describe('distance', () => {
	it('counts insertions, deletions and substitutions', () => {
		expect(distance('progeti', 'progetti')).toBe(1);
		expect(distance('agnete', 'agente')).toBe(2);
		expect(distance('', 'abc')).toBe(3);
		expect(distance('same', 'same')).toBe(0);
	});
});

describe('suggestPages', () => {
	it('finds the section behind a typo in the route', () => {
		expect(paths('progeti')).toEqual(['/it/progetti']);
	});

	it('finds the project behind a typo in the slug, and its section as a way out', () => {
		expect(paths('progetti/portsag')).toEqual(['/it/progetti/portsage', '/it/progetti']);
	});

	it('forgives a typo in the route of a detail', () => {
		expect(paths('progeti/relay')[0]).toBe('/it/progetti/relay');
	});

	it('finds a real page with something after it', () => {
		expect(paths('progetti/portsage/readme')[0]).toBe('/it/progetti/portsage');
	});

	it('suggests nothing for an address with nothing close', () => {
		expect(paths('wp-admin/setup.php')).toEqual([]);
		expect(paths('')).toEqual([]);
	});

	it('ignores case, slashes at the ends and percent encoding', () => {
		expect(paths('/Progetti/Portsage/')[0]).toBe('/it/progetti/portsage');
		expect(paths('progetti%2Fportsag')[0]).toBe('/it/progetti/portsage');
	});

	it('survives a malformed percent encoding', () => {
		expect(paths('progeti%')).toEqual(['/it/progetti']);
	});

	it('stops at the maximum', () => {
		expect(suggestPages('progetti/re', pages, 1)).toHaveLength(1);
	});
});

describe('searchWords', () => {
	it('splits the path into words for the list search', () => {
		expect(searchWords('progetti/portsag')).toBe('progetti portsag');
		expect(searchWords('wp-admin/setup.php')).toBe('wp admin setup');
	});

	it('drops numbers, single letters and keeps at most four words', () => {
		expect(searchWords('a/2024/b/uno-due-tre-quattro-cinque')).toBe('uno due tre quattro');
	});

	it('decodes the path', () => {
		expect(searchWords('agenti%20paralleli')).toBe('agenti paralleli');
	});
});
