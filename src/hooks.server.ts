import { ContentLoader } from '$lib/utils/content';
import {
	findRouteKeyAnyLang,
	isValidLanguage,
	isValidRouteForLang,
	translateRoute
} from '$lib/utils/i18n';
import type { Handle } from '@sveltejs/kit';

// Header di sicurezza applicati a tutte le risposte di pagina (la CSP è gestita
// da SvelteKit via svelte.config.js).
const SECURITY_HEADERS: Record<string, string> = {
	'X-Content-Type-Options': 'nosniff',
	'Referrer-Policy': 'strict-origin-when-cross-origin',
	'X-Frame-Options': 'SAMEORIGIN',
	'Permissions-Policy': 'geolocation=(), camera=(), microphone=(), payment=()'
};

function withSecurityHeaders(response: Response): Response {
	for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
		response.headers.set(key, value);
	}
	return response;
}

// Cache-Control per le pagine HTML servite con successo. Le pagine sono
// deterministiche per path (la lingua è nell'URL), quindi possono essere
// cacheate al CDN; il browser rivalida sempre (max-age=0) così un nuovo deploy
// è visibile subito. Non applicato a redirect (escono prima) né a errori.
function withPageCache(response: Response): Response {
	if (response.status >= 200 && response.status < 300) {
		response.headers.set(
			'Cache-Control',
			'public, max-age=0, s-maxage=300, stale-while-revalidate=86400'
		);
	}
	return response;
}

// Trova la sottorotta corretta per una lingua specifica, riusando le primitive i18n
function findRouteForLanguage(
	subRoute: string,
	targetLang: string,
	navigation: Record<string, Record<string, string>>
): string | null {
	const found = findRouteKeyAnyLang(subRoute, navigation);
	return found ? translateRoute(found.key, targetLang, navigation) : null;
}

// Costruisce il path di redirect unendo solo i segmenti non vuoti: evita lo slash
// finale (es. /en/projects, non /en/projects/) e quindi un secondo redirect.
function buildPath(...segments: string[]): string {
	return '/' + segments.filter(Boolean).join('/');
}

// Trova lo slug corretto per una lingua specifica
async function findSlugForLanguage(
	slug: string,
	sourceLang: string,
	targetLang: string,
	route: string,
	loader: ContentLoader
): Promise<string | null> {
	try {
		// Determina il tipo di contenuto basato sulla route
		const isProjects = route === 'projects' || route === 'progetti';

		// Usa la slug map leggera invece di caricare tutti i contenuti in tutte le lingue
		const slugMap = await loader.loadSlugMap();
		const section = isProjects ? slugMap.projects : slugMap.articles;

		// Trova l'item il cui slug nella lingua sorgente combacia, poi prendi quello target
		const entry = Object.values(section).find((langs) => langs[sourceLang] === slug);

		if (entry && entry[targetLang]) {
			return entry[targetLang];
		}

		return null;
	} catch (error) {
		console.error('Error finding slug for language:', error);
		return null;
	}
}

export const handle: Handle = async ({ event, resolve }) => {
	const { pathname, origin } = event.url;

	// Bypass the hook for sitemap.xml
	if (pathname === '/sitemap.xml') {
		return await resolve(event);
	}

	const pathSegments = pathname.split('/').filter(Boolean);

	try {
		const loader = new ContentLoader();
		const languages = await loader.loadConfig('languages');
		const navigation = await loader.loadConfig('navigation');

		// Determina la lingua corrente dalla URL
		let currentLang = 'en'; // default
		if (pathSegments.length > 0 && isValidLanguage(pathSegments[0], languages)) {
			currentLang = pathSegments[0];
		}

		// Gestisce percorsi con un solo segmento che non sono lingue valide
		if (pathSegments.length === 1) {
			if (!isValidLanguage(pathSegments[0], languages)) {
				// Reindirizza a /en per percorsi casuali
				return Response.redirect(new URL('/en', origin).toString(), 302);
			}
		}

		// Verifica che la rotta sia una sottorotta della lingua corretta
		if (pathSegments.length >= 2) {
			const [lang, sub] = pathSegments;
			const slug = pathSegments[2];

			// Controlla se la lingua esiste
			const langExists = isValidLanguage(lang, languages);

			if (langExists && navigation[lang]) {
				// PRIORITÀ 1: Lingua valida - controlla se la sottorotta è corretta per quella lingua
				if (!isValidRouteForLang(sub, lang, navigation)) {
					// Trova la sottorotta corretta per la lingua specificata
					// (es: /en/progetti → /en/projects)
					const correctSubRoute = findRouteForLanguage(sub, lang, navigation);

					if (correctSubRoute) {
						let remainingSegments = pathSegments.slice(2).join('/');

						// Se c'è uno slug, prova a tradurlo
						if (slug) {
							const originalLang = findRouteKeyAnyLang(sub, navigation)?.lang;

							if (originalLang) {
								const translatedSlug = await findSlugForLanguage(
									slug,
									originalLang,
									lang,
									correctSubRoute,
									loader
								);

								if (translatedSlug) {
									remainingSegments = remainingSegments.replace(slug, translatedSlug);
								}
							}
						}

						const redirectUrl = new URL(
							buildPath(lang, correctSubRoute, remainingSegments),
							origin
						);
						return Response.redirect(redirectUrl.toString(), 302);
					}
				} else if (slug) {
					// PRIORITÀ 1.5: Lingua e route valide ma slug potrebbe essere in lingua sbagliata
					// (es: /en/projects/piattaforma-e-commerce → /en/projects/e-commerce-platform)
					const allLanguages = Object.keys(navigation);

					// Cerca se lo slug attuale esiste in altre lingue
					for (const sourceLang of allLanguages) {
						if (sourceLang !== lang) {
							const translatedSlug = await findSlugForLanguage(slug, sourceLang, lang, sub, loader);

							if (translatedSlug && translatedSlug !== slug) {
								const remainingSegments = pathSegments
									.slice(2)
									.join('/')
									.replace(slug, translatedSlug);
								const redirectUrl = new URL(buildPath(lang, sub, remainingSegments), origin);
								return Response.redirect(redirectUrl.toString(), 302);
							}
						}
					}
				}
			} else {
				// PRIORITÀ 2: Lingua non valida - trova la lingua corretta per la sottorotta
				// (es: /xx/projects → /en/projects)
				const correctLang = findRouteKeyAnyLang(sub, navigation)?.lang;

				if (correctLang) {
					let remainingSegments = pathSegments.slice(2).join('/');

					// Se c'è uno slug, prova a tradurlo per la lingua corretta
					if (slug) {
						const translatedSlug = await findSlugForLanguage(slug, lang, correctLang, sub, loader);

						if (translatedSlug) {
							remainingSegments = remainingSegments.replace(slug, translatedSlug);
						}
					}

					const redirectUrl = new URL(buildPath(correctLang, sub, remainingSegments), origin);
					return Response.redirect(redirectUrl.toString(), 302);
				}
			}
		}

		return withPageCache(
			withSecurityHeaders(
				await resolve(event, {
					transformPageChunk: ({ html }: { html: string }) => html.replace('%lang%', currentLang)
				})
			)
		);
	} catch (error) {
		console.error('Error in hooks.server.ts:', error);
		// Fallback di sicurezza con lingua di default
		return withSecurityHeaders(
			await resolve(event, {
				transformPageChunk: ({ html }: { html: string }) => html.replace('%lang%', 'en')
			})
		);
	}
};
