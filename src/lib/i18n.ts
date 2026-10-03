import type { Language, NavigationConfig } from './config';

/**
 * Logica di routing i18n, pura e senza I/O: la usano pagine, catch-all dei redirect,
 * SEO e selettore lingua. Terminologia: la "route" è il segmento localizzato nell'URL
 * (`progetti`), la "sezione" è la chiave logica (`projects` | `articles`).
 */

export const SECTIONS = ['projects', 'articles', 'method', 'now', 'about', 'agent'] as const;
export type Section = (typeof SECTIONS)[number];

/** Sezioni con pagine di dettaglio, cioè con uno slug per voce. */
export const DETAIL_SECTIONS = ['projects', 'articles', 'method'] as const;
export type DetailSection = (typeof DETAIL_SECTIONS)[number];

export function isDetailSection(section: Section): section is DetailSection {
	return (DETAIL_SECTIONS as readonly string[]).includes(section);
}

/**
 * Route di versioni precedenti del sito che vanno ancora reindirizzate: link già
 * condivisi o indicizzati non devono finire su un 404. Valgono in ogni lingua.
 */
export const LEGACY_ROUTES: Record<string, Section> = {
	blog: 'articles',
	informazioni: 'about'
};

/** id contenuto -> lingua -> slug, per sezione con dettaglio. */
export type SlugMap = Record<DetailSection, Record<string, Record<string, string>>>;

export function isValidLanguage(lang: string | undefined, languages: Language[]): boolean {
	return !!lang && languages.some((l) => l.code === lang);
}

/** Prima lingua supportata nell'header Accept-Language per q-value, altrimenti fallback. */
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

/** Sezione di una route localizzata in una lingua (`progetti`, `it` -> `projects`), o null. */
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
 * Cerca la route in tutte le lingue: sezione e lingua in cui esiste, o null. Una route
 * legacy torna senza lingua, perché valeva per tutte.
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

/** Route localizzata di una sezione nella lingua target, o null. */
export function routeOf(
	section: Section,
	lang: string,
	navigation: NavigationConfig
): string | null {
	return navigation[lang]?.[section] ?? null;
}

/** Slug di un contenuto nella lingua target, partendo da uno slug in qualunque lingua. */
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
 * URL equivalente nella lingua target (selettore lingua e hreflang). Se il contenuto non
 * esiste nella lingua target ripiega sulla sezione, se la route è sconosciuta sulla home.
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
 * Redirect verso l'URL canonico per un path che non corrisponde a nessuna pagina, o
 * null se non c'è un canonico (allora è un 404). Copre: lingua sconosciuta, route di
 * un'altra lingua, slug di un'altra lingua, route senza lingua. Il risultato non ha mai
 * lo slash finale, così basta un solo hop.
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

	// Un solo segmento: una lingua è già una pagina; una route va sotto la sua lingua;
	// tutto il resto finisce sulla home di default.
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
