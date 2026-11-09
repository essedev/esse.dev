import type { APIRoute } from 'astro';
import source from '../scripts/sw.js?raw';
import { defaultLang, languageCodes } from '../lib/config';

// The service worker at the site's root, so its scope is the whole site (DECISIONS #47). The
// source is src/scripts/sw.js; here its first line gets the build's commit and the languages.
// A new commit changes the bytes, and the browser installs the new worker on its own.
export const prerender = true;

const CONFIG_LINE = /^const CONFIG = .*;$/m;

export const GET: APIRoute = () => {
	if (!CONFIG_LINE.test(source)) throw new Error('sw.js: the CONFIG line is missing');
	const config = {
		version: import.meta.env.BUILD_COMMIT,
		languages: languageCodes,
		defaultLang
	};
	const body = source.replace(CONFIG_LINE, `const CONFIG = ${JSON.stringify(config)};`);
	return new Response(body, { headers: { 'Content-Type': 'text/javascript; charset=utf-8' } });
};
