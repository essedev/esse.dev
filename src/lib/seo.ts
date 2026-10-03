import type { Language, NavigationConfig } from './config';
import { getLanguageUrl, type SlugMap } from './i18n';

/**
 * Helper SEO puri (canonical, hreflang, JSON-LD). Tutte le funzioni sono
 * deterministiche e prive di side effect, così da essere testabili in isolamento
 * e riusabili dal layout. La serializzazione JSON-LD avviene via serializeJsonLd.
 */

const AUTHOR_NAME = 'Simone Salerno';

export interface AlternateLink {
	hreflang: string;
	href: string;
}

type JsonLd = Record<string, unknown>;

/**
 * URL canonico assoluto per il path corrente (senza query string, senza trailing
 * slash superfluo). Ogni versione di lingua è canonica di se stessa: le altre
 * lingue sono dichiarate via hreflang.
 */
export function buildCanonical(origin: string, pathname: string): string {
	if (!pathname || pathname === '/') return origin;
	const clean = pathname.length > 1 && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
	return origin + clean;
}

/**
 * Link alternate hreflang per tutte le lingue + x-default. L'URL equivalente in
 * ogni lingua è calcolato con getLanguageUrl (stessa logica del language switcher).
 */
export function buildAlternates(params: {
	origin: string;
	pathname: string;
	navigation: NavigationConfig;
	slugMap: SlugMap;
	languages: Language[];
	defaultLang?: string;
}): AlternateLink[] {
	const { origin, pathname, navigation, slugMap, languages, defaultLang = 'en' } = params;

	const alternates: AlternateLink[] = languages.map((l) => ({
		hreflang: l.code,
		href: origin + getLanguageUrl({ pathname, search: '', navigation, slugMap, targetLang: l.code })
	}));

	const fallback = alternates.find((a) => a.hreflang === defaultLang) ?? alternates[0];
	if (fallback) {
		alternates.push({ hreflang: 'x-default', href: fallback.href });
	}

	return alternates;
}

/** Estrae i soli profili social (http/https) dai link di contatto, per sameAs. */
export function socialLinks(links: { url: string }[] | undefined): string[] {
	if (!links) return [];
	return links.filter((l) => /^https?:\/\//.test(l.url)).map((l) => l.url);
}

export function websiteJsonLd(params: {
	origin: string;
	lang: string;
	description: string;
}): JsonLd {
	return {
		'@context': 'https://schema.org',
		'@type': 'WebSite',
		name: AUTHOR_NAME,
		url: `${params.origin}/${params.lang}`,
		inLanguage: params.lang,
		description: params.description
	};
}

export function personJsonLd(params: { origin: string; sameAs: string[] }): JsonLd {
	return {
		'@context': 'https://schema.org',
		'@type': 'Person',
		name: AUTHOR_NAME,
		url: params.origin,
		...(params.sameAs.length ? { sameAs: params.sameAs } : {})
	};
}

export function blogPostingJsonLd(params: {
	canonical: string;
	title: string;
	description: string;
	image: string;
	datePublished: string;
	dateModified: string;
	lang: string;
}): JsonLd {
	return {
		'@context': 'https://schema.org',
		'@type': 'BlogPosting',
		headline: params.title,
		description: params.description,
		image: params.image,
		datePublished: params.datePublished,
		dateModified: params.dateModified,
		inLanguage: params.lang,
		url: params.canonical,
		mainEntityOfPage: { '@type': 'WebPage', '@id': params.canonical },
		author: { '@type': 'Person', name: AUTHOR_NAME },
		publisher: { '@type': 'Person', name: AUTHOR_NAME }
	};
}

export function creativeWorkJsonLd(params: {
	canonical: string;
	title: string;
	description: string;
	image: string;
	dateCreated: string;
	dateModified: string;
	lang: string;
}): JsonLd {
	return {
		'@context': 'https://schema.org',
		'@type': 'CreativeWork',
		name: params.title,
		description: params.description,
		image: params.image,
		dateCreated: params.dateCreated,
		dateModified: params.dateModified,
		inLanguage: params.lang,
		url: params.canonical,
		author: { '@type': 'Person', name: AUTHOR_NAME }
	};
}

/**
 * Serializza JSON-LD per inserimento inline in <script type="application/ld+json">.
 * Esegue l'escape di '<' per impedire la chiusura prematura del tag script.
 */
export function serializeJsonLd(data: JsonLd | JsonLd[]): string {
	return JSON.stringify(data).replace(/</g, '\\u003c');
}
