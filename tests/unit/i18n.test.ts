import { describe, expect, it } from 'vitest';
import type { Language, NavigationConfig } from '../../src/lib/config';
import {
	findSectionAnyLang,
	getLanguageUrl,
	isValidLanguage,
	preferredLanguage,
	resolveRedirect,
	routeOf,
	sectionOf,
	translateSlug,
	type SlugMap
} from '../../src/lib/i18n';

const languages: Language[] = [
	{ code: 'en', name: 'English' },
	{ code: 'it', name: 'Italiano' }
];

const navigation: NavigationConfig = {
	en: { projects: 'projects', articles: 'writing', method: 'method', now: 'now', about: 'about' },
	it: {
		projects: 'progetti',
		articles: 'scritti',
		method: 'metodo',
		now: 'adesso',
		about: 'chi-sono'
	}
};

const slugMap: SlugMap = {
	projects: { budokan: { en: 'budokan', it: 'budokan' } },
	articles: { lab: { en: 'my-new-laboratory', it: 'il-mio-nuovo-laboratorio' } },
	method: { context: { en: 'context', it: 'contesto' } }
};

describe('isValidLanguage', () => {
	it('accetta i codici supportati, rifiuta gli altri e undefined', () => {
		expect(isValidLanguage('en', languages)).toBe(true);
		expect(isValidLanguage('xx', languages)).toBe(false);
		expect(isValidLanguage(undefined, languages)).toBe(false);
	});
});

describe('sectionOf / routeOf / findSectionAnyLang', () => {
	it('mappa la route localizzata alla sezione e ritorno', () => {
		expect(sectionOf('progetti', 'it', navigation)).toBe('projects');
		expect(sectionOf('writing', 'en', navigation)).toBe('articles');
		expect(sectionOf('adesso', 'it', navigation)).toBe('now');
		expect(routeOf('projects', 'it', navigation)).toBe('progetti');
	});

	it('una route di un’altra lingua non vale nella lingua corrente', () => {
		expect(sectionOf('projects', 'it', navigation)).toBeNull();
		expect(sectionOf('nope', 'en', navigation)).toBeNull();
		expect(routeOf('projects', 'xx', navigation)).toBeNull();
	});

	it('trova sezione e lingua di una route in qualunque lingua', () => {
		expect(findSectionAnyLang('progetti', navigation)).toEqual({ section: 'projects', lang: 'it' });
		expect(findSectionAnyLang('nope', navigation)).toBeNull();
	});
});

describe('translateSlug', () => {
	it('traduce partendo dallo slug di qualunque lingua', () => {
		expect(translateSlug('il-mio-nuovo-laboratorio', 'articles', 'en', slugMap)).toBe(
			'my-new-laboratory'
		);
		expect(translateSlug('my-new-laboratory', 'articles', 'it', slugMap)).toBe(
			'il-mio-nuovo-laboratorio'
		);
	});

	it('null per slug sconosciuti o nella sezione sbagliata', () => {
		expect(translateSlug('nope', 'projects', 'en', slugMap)).toBeNull();
		expect(translateSlug('budokan', 'articles', 'en', slugMap)).toBeNull();
	});
});

describe('preferredLanguage', () => {
	const supported = ['en', 'it'];

	it('sceglie la prima lingua supportata per q-value, anche fuori ordine', () => {
		expect(preferredLanguage('it-IT,it;q=0.9,en;q=0.8', supported, 'en')).toBe('it');
		expect(preferredLanguage('en;q=0.3, it;q=0.9', supported, 'en')).toBe('it');
		expect(preferredLanguage('it-CH', supported, 'en')).toBe('it');
	});

	it('usa il fallback se nessuna lingua è supportata o manca l’header', () => {
		expect(preferredLanguage('fr-FR,de;q=0.8', supported, 'en')).toBe('en');
		expect(preferredLanguage(null, supported, 'en')).toBe('en');
	});
});

describe('getLanguageUrl', () => {
	const url = (pathname: string, targetLang: string, search = '') =>
		getLanguageUrl({ pathname, search, navigation, slugMap, targetLang });

	it('home, sezione e dettaglio con slug tradotto', () => {
		expect(url('/en', 'it')).toBe('/it');
		expect(url('/en/projects', 'it')).toBe('/it/progetti');
		expect(url('/en/projects/budokan', 'it')).toBe('/it/progetti/budokan');
		expect(url('/it/scritti/il-mio-nuovo-laboratorio', 'en')).toBe('/en/writing/my-new-laboratory');
		expect(url('/it/metodo/contesto', 'en')).toBe('/en/method/context');
		expect(url('/it/chi-sono', 'en')).toBe('/en/about');
	});

	it('conserva la query string', () => {
		expect(url('/en/projects/budokan', 'it', '?x=1')).toBe('/it/progetti/budokan?x=1');
	});

	it('ripiega su sezione o home se manca la traduzione', () => {
		expect(url('/en/projects/unknown', 'it')).toBe('/it/progetti');
		expect(url('/en/random', 'it')).toBe('/it');
	});
});

describe('resolveRedirect', () => {
	const go = (path: string) =>
		resolveRedirect(path, { languages, navigation, slugMap, defaultLang: 'en' });

	it('route di un’altra lingua sotto una lingua valida', () => {
		expect(go('/en/progetti')).toBe('/en/projects');
		expect(go('/en/progetti/budokan')).toBe('/en/projects/budokan');
	});

	it('slug di un’altra lingua', () => {
		expect(go('/en/writing/il-mio-nuovo-laboratorio')).toBe('/en/writing/my-new-laboratory');
		expect(go('/it/scritti/my-new-laboratory')).toBe('/it/scritti/il-mio-nuovo-laboratorio');
		expect(go('/en/method/contesto')).toBe('/en/method/context');
	});

	it('route di versioni precedenti del sito (blog, informazioni)', () => {
		expect(go('/en/blog')).toBe('/en/writing');
		expect(go('/it/blog/my-new-laboratory')).toBe('/it/scritti/il-mio-nuovo-laboratorio');
		expect(go('/it/informazioni')).toBe('/it/chi-sono');
		expect(go('/blog')).toBe('/en/writing');
	});

	it('una sezione senza dettaglio non accetta uno slug', () => {
		expect(go('/it/adesso/qualcosa')).toBeNull();
	});

	it('lingua sconosciuta: va nella lingua della route, slug compreso', () => {
		expect(go('/xx/projects')).toBe('/en/projects');
		expect(go('/xx/progetti/budokan')).toBe('/it/progetti/budokan');
	});

	it('un segmento solo: route senza lingua o indirizzo a caso', () => {
		expect(go('/progetti')).toBe('/it/progetti');
		expect(go('/totally-unknown')).toBe('/en');
	});

	it('nessun redirect per un URL già canonico o senza canonico (404)', () => {
		expect(go('/en')).toBeNull();
		expect(go('/en/projects')).toBeNull();
		expect(go('/en/projects/budokan')).toBeNull();
		expect(go('/en/projects/does-not-exist')).toBeNull();
		expect(go('/en/nope/x')).toBeNull();
		expect(go('/a/b/c/d')).toBeNull();
	});
});
