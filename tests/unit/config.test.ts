import { describe, expect, it } from 'vitest';
import { featured, languageCodes, navigation } from '../../src/lib/config';

describe('configuration', () => {
	it('gives every language a route for every section, distinct from each other', () => {
		for (const lang of languageCodes) {
			const { projects, articles } = navigation[lang];
			expect(projects).toBeTruthy();
			expect(articles).toBeTruthy();
			expect(projects).not.toBe(articles);
		}
	});

	it('does not repeat a project in the showcase', () => {
		expect(new Set(featured.projects).size).toBe(featured.projects.length);
	});
});
