import { describe, expect, it } from 'vitest';
import {
	listProjects,
	publicRepos,
	repoName,
	searchSite,
	type SiteDoc
} from '../../src/agent/site-index';

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

	it('finds a project by the name of an earlier iteration', () => {
		const maia = doc({
			path: '/en/projects/maia',
			title: 'Maia',
			previously: [{ name: 'Cosmoscope', year: 2025, note: 'Questions as concept maps.' }]
		});
		expect(searchSite([...docs, maia], 'cosmoscope', { lang: 'en' }).map((h) => h.path)).toEqual([
			'/en/projects/maia'
		]);
	});

	it('returns nothing for an empty query', () => {
		expect(searchSite(docs, '   ', { lang: 'en' })).toEqual([]);
	});
});

describe('listProjects', () => {
	const projects = [
		doc({
			path: '/en/projects/a',
			title: 'A',
			date: '2026-01-01',
			status: 'completed',
			tags: ['Swift']
		}),
		doc({ path: '/en/projects/b', title: 'B', date: '2026-06-01', status: 'in-progress' }),
		doc({
			path: '/en/projects/c',
			title: 'C',
			date: '2025-01-01',
			featured: true,
			repo: 'https://github.com/essedev/c'
		}),
		doc({ path: '/it/progetti/a', lang: 'it', title: 'A' })
	];

	it('puts the showcase first, then the newest', () => {
		expect(listProjects(projects, { lang: 'en' }).map((p) => p.title)).toEqual(['C', 'B', 'A']);
	});

	it('filters by state and by tag, ignoring case', () => {
		expect(
			listProjects(projects, { lang: 'en', status: 'in-progress' }).map((p) => p.title)
		).toEqual(['B']);
		expect(listProjects(projects, { lang: 'en', tag: 'swift' }).map((p) => p.title)).toEqual(['A']);
	});

	it('gives the repo as owner/name', () => {
		expect(listProjects(projects, { lang: 'en' })[0].repo).toBe('essedev/c');
	});
});

describe('repos', () => {
	it('reads owner/name from GitHub URLs only', () => {
		expect(repoName('https://github.com/essedev/relay')).toBe('essedev/relay');
		expect(repoName('https://github.com/essedev/didatticaintegrata.it.git')).toBe(
			'essedev/didatticaintegrata.it'
		);
		expect(repoName('https://gitlab.com/essedev/relay')).toBeNull();
		expect(repoName('https://github.com/essedev')).toBeNull();
	});

	it('allows the repos of published projects plus the given ones, once each', () => {
		const docs = [
			doc({ repo: 'https://github.com/essedev/relay' }),
			doc({ lang: 'it', repo: 'https://github.com/essedev/relay' })
		];
		expect(publicRepos(docs, ['essedev/esse.dev'])).toEqual(['essedev/esse.dev', 'essedev/relay']);
	});
});
