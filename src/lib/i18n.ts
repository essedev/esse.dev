import type { Language, NavigationConfig } from './config';

/**
 * i18n routing logic, pure and free of I/O: used by pages, the redirect catch-all, SEO and
 * the language switcher. Terminology: the "route" is the localized segment in the URL
 * (`progetti`), the "section" is the logical key (`projects` | `articles`).
 */

/** The logical sections of the site. */
export const SECTIONS = [
	'projects',
	'articles',
	'method',
	'now',
	'about',
	'agent',
	'privacy'
] as const;
/** One of `SECTIONS`. */
export type Section = (typeof SECTIONS)[number];

/** Sections with detail pages, that is with a slug per entry. */
export const DETAIL_SECTIONS = ['projects', 'articles', 'method'] as const;
/** One of `DETAIL_SECTIONS`. */
export type DetailSection = (typeof DETAIL_SECTIONS)[number];

/** Whether a section has detail pages. */
export function isDetailSection(section: Section): section is DetailSection {
	return (DETAIL_SECTIONS as readonly string[]).includes(section);
}

/**
 * Routes of earlier versions of the site that must still redirect: links already shared or
 * indexed must not end in a 404. They apply in every language.
 */
export const LEGACY_ROUTES: Record<string, Section> = {
	blog: 'articles',
	informazioni: 'about'
};

/** Content id -> language -> slug, per section with detail pages. */
export type SlugMap = Record<DetailSection, Record<string, Record<string, string>>>;

/** Whether `lang` is one of the configured languages. */
export function isValidLanguage(lang: string | undefined, languages: Language[]): boolean {
	return !!lang && languages.some((l) => l.code === lang);
}

/** The first supported language in the Accept-Language header by q-value, else the fallback. */
export function preferredLanguage(
	acceptLanguage: string | null | undefined,
	supported: string[],
	fallback: string
): string {
	if (!acceptLanguage) return fallback;
	const ranked = acceptLanguage
		.split(',')
		.map((part) => {
			const [tag, ...params] = part.trim().split(';');
			const qParam = params.find((p) => p.trim().startsWith('q='));
			const q = qParam ? Number.parseFloat(qParam.split('=')[1]) : 1;
			return { base: tag.trim().toLowerCase().split('-')[0], q: Number.isNaN(q) ? 0 : q };
		})
		.filter((l) => l.base)
		.sort((a, b) => b.q - a.q);
	return ranked.find((l) => supported.includes(l.base))?.base ?? fallback;
}

/** The section of a localized route in a language (`progetti`, `it` -> `projects`), or null. */
export function sectionOf(
	route: string | undefined,
	lang: string,
	navigation: NavigationConfig
): Section | null {
	const map = navigation[lang];
	if (!route || !map) return null;
	return SECTIONS.find((s) => map[s] === route) ?? null;
}

/**
 * Looks the route up in every language: the section and the language it exists in, or null.
 * A legacy route returns without a language, because it applied to all.
 */
export function findSectionAnyLang(
	route: string,
	navigation: NavigationConfig
): { section: Section; lang: string | null } | null {
	for (const lang of Object.keys(navigation)) {
		const section = sectionOf(route, lang, navigation);
		if (section) return { section, lang };
	}
	const legacy = LEGACY_ROUTES[route];
	return legacy ? { section: legacy, lang: null } : null;
}

/** The localized route of a section in the target language, or null. */
export function routeOf(
	section: Section,
	lang: string,
	navigation: NavigationConfig
): string | null {
	return navigation[lang]?.[section] ?? null;
}

/** The slug of an item in the target language, starting from a slug in any language. */
export function translateSlug(
	slug: string,
	section: DetailSection,
	targetLang: string,
	slugMap: SlugMap
): string | null {
	for (const langs of Object.values(slugMap[section])) {
		if (Object.values(langs).includes(slug)) return langs[targetLang] ?? null;
	}
	return null;
}

/**
 * The equivalent URL in the target language (language switcher and hreflang). If the item
 * does not exist in the target language it falls back to the section, and to the home if the
 * route is unknown.
 */
export function getLanguageUrl(params: {
	pathname: string;
	search?: string;
	navigation: NavigationConfig;
	slugMap: SlugMap;
	targetLang: string;
}): string {
	const { pathname, search = '', navigation, slugMap, targetLang } = params;
	const [lang, route, slug] = pathname.split('/').filter(Boolean);
	const home = `/${targetLang}${search}`;
	if (!route) return home;

	const section = sectionOf(route, lang, navigation);
	const targetRoute = section && routeOf(section, targetLang, navigation);
	if (!section || !targetRoute) return home;
	if (!slug || !isDetailSection(section)) return `/${targetLang}/${targetRoute}${search}`;

	const targetSlug = translateSlug(slug, section, targetLang, slugMap);
	return targetSlug
		? `/${targetLang}/${targetRoute}/${targetSlug}${search}`
		: `/${targetLang}/${targetRoute}${search}`;
}

/**
 * The redirect to the canonical URL for a path that matches no page, or null if there is no
 * canonical (then it is a 404). It covers: unknown language, route of another language,
 * slug of another language, route without a language. The result never has a trailing
 * slash, so a single hop is enough.
 */
export function resolveRedirect(
	pathname: string,
	ctx: {
		languages: Language[];
		navigation: NavigationConfig;
		slugMap: SlugMap;
		defaultLang: string;
	}
): string | null {
	const { languages, navigation, slugMap, defaultLang } = ctx;
	const segments = pathname.split('/').filter(Boolean);
	if (segments.length === 0 || segments.length > 3) return null;

	const path = (...parts: string[]) => '/' + parts.join('/');

	// A single segment: a language is already a page; a route goes under its language;
	// everything else ends on the default home.
	if (segments.length === 1) {
		const [only] = segments;
		if (isValidLanguage(only, languages)) return null;
		const found = findSectionAnyLang(only, navigation);
		if (!found) return path(defaultLang);
		const lang = found.lang ?? defaultLang;
		return path(lang, routeOf(found.section, lang, navigation) ?? only);
	}

	const [lang, route, slug] = segments;
	const langOk = isValidLanguage(lang, languages);
	const own = langOk ? sectionOf(route, lang, navigation) : null;
	const found = own ? { section: own, lang } : findSectionAnyLang(route, navigation);
	if (!found) return null;

	const targetLang = langOk ? lang : (found.lang ?? defaultLang);
	const targetRoute = routeOf(found.section, targetLang, navigation);
	if (!targetRoute) return null;

	if (!slug) {
		const target = path(targetLang, targetRoute);
		return target === path(...segments) ? null : target;
	}

	if (!isDetailSection(found.section)) return null;
	const targetSlug = translateSlug(slug, found.section, targetLang, slugMap);
	if (!targetSlug) return null;
	const target = path(targetLang, targetRoute, targetSlug);
	return target === path(...segments) ? null : target;
}
