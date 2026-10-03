import { describe, expect, it } from 'vitest';
import { featured, languageCodes, navigation } from '../../src/lib/config';

describe('configurazione', () => {
	it('ogni lingua ha la route di tutte le sezioni, diverse fra loro', () => {
		for (const lang of languageCodes) {
			const { projects, articles } = navigation[lang];
			expect(projects).toBeTruthy();
			expect(articles).toBeTruthy();
			expect(projects).not.toBe(articles);
		}
	});

	it('la vetrina non ripete progetti', () => {
		expect(new Set(featured.projects).size).toBe(featured.projects.length);
	});
});
