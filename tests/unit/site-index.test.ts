import { describe, expect, it } from 'vitest';
import { searchSite, type SiteDoc } from '../../src/agent/site-index';

const doc = (over: Partial<SiteDoc>): SiteDoc => ({
	path: '/en/projects/x',
	lang: 'en',
	kind: 'project',
	title: 'X',
	summary: '',
	tags: [],
	body: '',
	...over
});

const docs = [
	doc({ path: '/en/projects/relay', title: 'Relay', summary: 'A terminal', tags: ['Swift'] }),
	doc({ path: '/en/projects/flux', title: 'Flux', body: 'built with swift and a relay of events' }),
	doc({ path: '/it/progetti/relay', lang: 'it', title: 'Relay', summary: 'Un terminale' }),
	doc({ path: '/en/method/context', kind: 'method', title: 'Context is the work' })
];

describe('searchSite', () => {
	it('ranks a title match above a body match', () => {
		const hits = searchSite(docs, 'relay', { lang: 'en' });
		expect(hits.map((h) => h.path)).toEqual(['/en/projects/relay', '/en/projects/flux']);
	});

	it('stays in one language', () => {
		expect(searchSite(docs, 'relay', { lang: 'it' }).map((h) => h.path)).toEqual([
			'/it/progetti/relay'
		]);
	});

	it('filters by kind and ignores accents and case', () => {
		expect(searchSite(docs, 'CONTEXT', { lang: 'en', kind: 'method' })).toHaveLength(1);
		expect(searchSite(docs, 'terminale', { lang: 'it' })).toHaveLength(1);
	});

	it('returns nothing for an empty query', () => {
		expect(searchSite(docs, '   ', { lang: 'en' })).toEqual([]);
	});
});
