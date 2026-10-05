import { describe, expect, it } from 'vitest';
import {
	blogPostingJsonLd,
	buildAlternates,
	buildCanonical,
	creativeWorkJsonLd,
	personJsonLd,
	serializeJsonLd,
	socialLinks,
	websiteJsonLd
} from '../../src/lib/seo';
import type { Language, NavigationConfig } from '../../src/lib/config';
import type { SlugMap } from '../../src/lib/i18n';

const origin = 'https://esse.dev';

const languages: Language[] = [
	{ code: 'en', name: 'English' },
	{ code: 'it', name: 'Italiano' }
];

const navigation: NavigationConfig = {
	en: {
		projects: 'projects',
		articles: 'writing',
		method: 'method',
		now: 'now',
		about: 'about',
		agent: 'agent'
	},
	it: {
		projects: 'progetti',
		articles: 'scritti',
		method: 'metodo',
		now: 'adesso',
		about: 'chi-sono',
		agent: 'agente'
	}
};

const slugMap: SlugMap = {
	projects: { budokan: { en: 'budokan', it: 'budokan' } },
	articles: { lab: { en: 'my-new-laboratory', it: 'il-mio-nuovo-laboratorio' } },
	method: { context: { en: 'context', it: 'contesto' } }
};

describe('buildCanonical', () => {
	it('builds an absolute canonical from origin + pathname', () => {
		expect(buildCanonical(origin, '/en/writing')).toBe('https://esse.dev/en/writing');
	});

	it('returns origin for the root path', () => {
		expect(buildCanonical(origin, '/')).toBe(origin);
		expect(buildCanonical(origin, '')).toBe(origin);
	});

	it('strips a superfluous trailing slash', () => {
		expect(buildCanonical(origin, '/en/writing/')).toBe('https://esse.dev/en/writing');
	});
});

describe('buildAlternates', () => {
	it('emits one alternate per language plus x-default', () => {
		const alts = buildAlternates({
			origin,
			pathname: '/en/writing',
			navigation,
			slugMap,
			languages
		});
		expect(alts).toEqual([
			{ hreflang: 'en', href: 'https://esse.dev/en/writing' },
			{ hreflang: 'it', href: 'https://esse.dev/it/scritti' },
			{ hreflang: 'x-default', href: 'https://esse.dev/en/writing' }
		]);
	});

	it('translates route + slug on detail pages', () => {
		const alts = buildAlternates({
			origin,
			pathname: '/en/writing/my-new-laboratory',
			navigation,
			slugMap,
			languages
		});
		expect(alts.find((a) => a.hreflang === 'it')?.href).toBe(
			'https://esse.dev/it/scritti/il-mio-nuovo-laboratorio'
		);
	});

	it('points x-default to the chosen default language', () => {
		const alts = buildAlternates({
			origin,
			pathname: '/it/progetti',
			navigation,
			slugMap,
			languages,
			defaultLang: 'it'
		});
		const xDefault = alts.find((a) => a.hreflang === 'x-default');
		const it = alts.find((a) => a.hreflang === 'it');
		expect(xDefault?.href).toBe(it?.href);
	});
});

describe('socialLinks', () => {
	const links: { name: string; url: string }[] = [
		{ name: 'Email', url: 'mailto:hello@esse.dev' },
		{ name: 'LinkedIn', url: 'https://www.linkedin.com/in/simone-salerno' },
		{ name: 'GitHub', url: 'https://github.com/essedev/' }
	];

	it('keeps only http(s) profiles, dropping mailto', () => {
		expect(socialLinks(links)).toEqual([
			'https://www.linkedin.com/in/simone-salerno',
			'https://github.com/essedev/'
		]);
	});

	it('returns an empty array when links are missing', () => {
		expect(socialLinks(undefined)).toEqual([]);
	});
});

describe('JSON-LD builders', () => {
	it('websiteJsonLd carries name, url and language', () => {
		const ld = websiteJsonLd({ origin, lang: 'en', description: 'Portfolio' });
		expect(ld['@type']).toBe('WebSite');
		expect(ld.url).toBe('https://esse.dev/en');
		expect(ld.inLanguage).toBe('en');
	});

	it('personJsonLd omits sameAs when there are no socials', () => {
		expect(personJsonLd({ origin, sameAs: [] })).not.toHaveProperty('sameAs');
		expect(personJsonLd({ origin, sameAs: ['https://x.com/essedotdev/'] }).sameAs).toEqual([
			'https://x.com/essedotdev/'
		]);
	});

	it('blogPostingJsonLd maps article fields', () => {
		const ld = blogPostingJsonLd({
			canonical: `${origin}/en/writing/lab`,
			title: 'My Lab',
			description: 'desc',
			image: `${origin}/og/x.png`,
			datePublished: '2025-01-01',
			dateModified: '2025-02-01',
			lang: 'en'
		});
		expect(ld['@type']).toBe('BlogPosting');
		expect(ld.headline).toBe('My Lab');
		expect(ld.datePublished).toBe('2025-01-01');
		expect((ld.mainEntityOfPage as Record<string, unknown>)['@id']).toBe(
			'https://esse.dev/en/writing/lab'
		);
	});

	it('creativeWorkJsonLd maps project fields', () => {
		const ld = creativeWorkJsonLd({
			canonical: `${origin}/en/projects/budokan`,
			title: 'Budokan',
			description: 'desc',
			image: `${origin}/og/x.png`,
			dateCreated: '2024-01-01',
			dateModified: '2024-06-01',
			lang: 'en'
		});
		expect(ld['@type']).toBe('CreativeWork');
		expect(ld.name).toBe('Budokan');
		expect(ld.dateCreated).toBe('2024-01-01');
	});
});

describe('serializeJsonLd', () => {
	it('escapes "<" to prevent premature </script> closure', () => {
		const out = serializeJsonLd({ '@type': 'Thing', name: 'a</script>b' });
		expect(out).not.toContain('</script>');
		expect(out).toContain('\\u003c/script>');
	});

	it('serializes arrays of objects', () => {
		const out = serializeJsonLd([{ '@type': 'WebSite' }, { '@type': 'Person' }]);
		expect(JSON.parse(out)).toHaveLength(2);
	});
});
