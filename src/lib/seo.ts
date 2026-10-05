import type { Language, NavigationConfig } from './config';
import { getLanguageUrl, type SlugMap } from './i18n';

/**
 * Pure SEO helpers (canonical, hreflang, JSON-LD). Every function is deterministic and
 * free of side effects, so it can be tested in isolation and reused by the layout. JSON-LD
 * is serialized through `serializeJsonLd`.
 */

const AUTHOR_NAME = 'Simone Salerno';

/** One hreflang alternate link. */
export interface AlternateLink {
	hreflang: string;
	href: string;
}

type JsonLd = Record<string, unknown>;

/**
 * The absolute canonical URL for the current path (no query string, no superfluous
 * trailing slash). Each language version is canonical to itself: the other languages are
 * declared through hreflang.
 */
export function buildCanonical(origin: string, pathname: string): string {
	if (!pathname || pathname === '/') return origin;
	const clean = pathname.length > 1 && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
	return origin + clean;
}

/**
 * The hreflang alternate links for all languages plus x-default. The equivalent URL in each
 * language is computed with `getLanguageUrl` (same logic as the language switcher).
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

/** Extracts only the social profiles (http/https) from the contact links, for sameAs. */
export function socialLinks(links: { url: string }[] | undefined): string[] {
	if (!links) return [];
	return links.filter((l) => /^https?:\/\//.test(l.url)).map((l) => l.url);
}

/** The `WebSite` JSON-LD of a language home. */
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

/** The `Person` JSON-LD of the author. */
export function personJsonLd(params: { origin: string; sameAs: string[] }): JsonLd {
	return {
		'@context': 'https://schema.org',
		'@type': 'Person',
		name: AUTHOR_NAME,
		url: params.origin,
		...(params.sameAs.length ? { sameAs: params.sameAs } : {})
	};
}

/** The `BlogPosting` JSON-LD of an article. */
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

/** The `CreativeWork` JSON-LD of a project. */
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
 * Serializes JSON-LD for inline insertion in <script type="application/ld+json">. Escapes
 * '<' so the script tag cannot be closed early.
 */
export function serializeJsonLd(data: JsonLd | JsonLd[]): string {
	return JSON.stringify(data).replace(/</g, '\\u003c');
}
