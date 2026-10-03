import { describe, expect, it } from 'vitest';
import { languageCodes, navigation } from '../../src/lib/config';
import { site, translator } from '../../src/lib/site';

describe('testi del sito', () => {
	it('ogni lingua ha tutte le chiavi della UI dell’inglese, non vuote', () => {
		const keys = Object.keys(site('en').ui).sort();
		for (const lang of languageCodes) {
			expect(Object.keys(site(lang).ui).sort()).toEqual(keys);
		}
	});

	it('ogni lingua ha le route di tutte le sezioni', () => {
		for (const lang of languageCodes) {
			expect(navigation[lang].projects).toBeTruthy();
			expect(navigation[lang].articles).toBeTruthy();
		}
	});

	it('il traduttore restituisce la stringa della lingua', () => {
		expect(translator('it')('back')).toBe('Indietro');
		expect(translator('en')('back')).toBe('Back');
	});
});
