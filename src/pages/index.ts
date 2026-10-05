import type { APIRoute } from 'astro';
import { defaultLang, languageCodes } from '../lib/config';
import { preferredLanguage } from '../lib/i18n';

// The root picks the language from the browser (Accept-Language), with an English fallback.
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
