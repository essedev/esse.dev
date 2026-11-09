import type { APIRoute, GetStaticPaths } from 'astro';
import { existsSync } from 'node:fs';
import globalCss from '../../styles/global.css?raw';
import { navigation, languageCodes } from '../../lib/config';
import { readTokens } from '../../lib/css-tokens';
import { SCREENSHOTS, screenshotPath } from '../../lib/pwa';
import { getSite } from '../../lib/site';

// The web app manifest per language (DECISIONS #47): installed from an Italian page the app
// has its Italian description and shortcuts. One `id` for both, so it is one app. The colors
// are the dark theme's tokens read from global.css, as the sitemap's (#32).
export const prerender = true;

export const getStaticPaths: GetStaticPaths = () =>
	languageCodes.map((lang) => ({ params: { lang } }));

export const GET: APIRoute = async ({ params }) => {
	const lang = params.lang!;
	const site = await getSite(lang);
	const routes = navigation[lang];
	const colors = readTokens(globalCss, '@theme', ['--color-bar-top', '--color-bg']);

	// `pnpm pwa-screenshots` builds the site to capture them, before they exist: only that
	// build goes without. Any other fails on a missing one (a new language or form).
	const capturing = process.env.PWA_SCREENSHOTS === 'capture';
	const screenshots = (capturing ? [] : SCREENSHOTS).map((shot) => {
		const src = screenshotPath(lang, shot);
		if (!existsSync(`public${src}`)) {
			throw new Error(`manifest: ${src} is missing, run pnpm pwa-screenshots`);
		}
		const { width, height } = shot.viewport;
		return {
			src,
			sizes: `${width * shot.scale}x${height * shot.scale}`,
			type: 'image/webp',
			form_factor: shot.form
		};
	});

	const manifest = {
		id: '/',
		name: 'esse.dev - Simone Salerno',
		short_name: 'esse.dev',
		description: site.description,
		lang,
		dir: 'ltr',
		start_url: `/${lang}`,
		scope: '/',
		display: 'standalone',
		theme_color: colors['--color-bar-top'],
		background_color: colors['--color-bg'],
		categories: ['developer', 'productivity'],
		icons: [192, 512].flatMap((size) => [
			{
				src: `/web-app-manifest-any-${size}x${size}.png`,
				sizes: `${size}x${size}`,
				type: 'image/png',
				purpose: 'any'
			},
			{
				src: `/web-app-manifest-${size}x${size}.png`,
				sizes: `${size}x${size}`,
				type: 'image/png',
				purpose: 'maskable'
			}
		]),
		shortcuts: (['projects', 'agent', 'method'] as const).map((section) => ({
			name: site.sections[section],
			url: `/${lang}/${routes[section]}`
		})),
		screenshots
	};

	return new Response(JSON.stringify(manifest, null, '\t'), {
		headers: { 'Content-Type': 'application/manifest+json; charset=utf-8' }
	});
};
