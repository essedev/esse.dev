import type { APIRoute } from 'astro';
import { defaultLang, languageCodes } from '../lib/config';
import { preferredLanguage } from '../lib/i18n';

// La root sceglie la lingua dal browser (Accept-Language), con fallback inglese.
export const prerender = false;

export const GET: APIRoute = ({ request }) => {
	const lang = preferredLanguage(
		request.headers.get('accept-language'),
		languageCodes,
		defaultLang
	);
	return new Response(null, {
		status: 302,
		headers: { Location: `/${lang}`, Vary: 'Accept-Language', 'Cache-Control': 'private, no-store' }
	});
};
