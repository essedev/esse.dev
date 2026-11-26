import { describe, expect, it } from 'vitest';
import { featured, languageCodes, navigation, tagLabel, tags } from '../../src/lib/config';

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

	it('labels every project tag in every language, each label distinct in its language', () => {
		for (const lang of languageCodes) {
			const labels = Object.keys(tags).map((id) => tagLabel(id, lang));
			expect(labels.every(Boolean)).toBe(true);
			expect(new Set(labels).size).toBe(labels.length);
		}
	});
});
