// @ts-check
import cloudflare from '@astrojs/cloudflare';
import svelte from '@astrojs/svelte';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, fontProviders } from 'astro/config';
import { execSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

// The theme and boot scripts run inline, before the first paint, and Astro does not hash
// inline scripts: each hash comes from the same file that the layout inlines.
/** @returns {`sha256-${string}`} */
const inlineHash = (/** @type {string} */ file) =>
	`sha256-${createHash('sha256')
		.update(readFileSync(new URL(file, import.meta.url), 'utf8'))
		.digest('base64')}`;

// The build the boot names (DECISIONS #37): the commit from Workers Builds, else git; outside
// a repository (a tarball) the boot says `dev`, a build without a commit to name.
const gitHead = () => {
	try {
		return execSync('git rev-parse HEAD', { encoding: 'utf8', stdio: 'pipe' }).trim();
	} catch {
		return 'dev';
	}
};
const buildCommit = (process.env.WORKERS_CI_COMMIT_SHA ?? gitHead()).slice(0, 7);
const buildDate = new Date().toISOString().slice(0, 10);

// Static site: every page is prerendered. Only the root (which picks the language from the
// browser) and the i18n redirect catch-all run on the Worker, and they have
// `prerender = false`. Prerendering runs in Node because the OG images use resvg (native).
export default defineConfig({
	site: 'https://esse.dev',
	trailingSlash: 'never',
	build: { format: 'file' },
	adapter: cloudflare({ prerenderEnvironment: 'node', imageService: 'compile' }),
	session: false,
	// No code highlighting for now: Shiki uses inline styles that the CSP blocks.
	markdown: { syntaxHighlight: false },
	// Responsive images in Markdown too: a srcset generated at build time instead of the original.
	image: { layout: 'constrained', responsiveStyles: true },
	integrations: [svelte()],
	// Self-hosted fonts through the Fonts API: files downloaded at build time, preload and
	// tuned fallbacks to reduce layout shift. The CSS variables are used in the @theme of
	// global.css.
	fonts: [
		{ provider: fontProviders.fontsource(), name: 'Geist', cssVariable: '--font-geist' },
		{ provider: fontProviders.fontsource(), name: 'Geist Mono', cssVariable: '--font-geist-mono' },
		// The interface mono: pixel, readable even when small (MIT, license next to the file).
		{
			provider: fontProviders.local(),
			name: 'Departure Mono',
			cssVariable: '--font-departure',
			options: {
				variants: [
					{ src: ['./src/assets/fonts/DepartureMono-Regular.woff2'], weight: 400, style: 'normal' }
				]
			}
		}
	],
	security: {
		csp: {
			directives: [
				"default-src 'self'",
				"img-src 'self' data:",
				"font-src 'self'",
				"connect-src 'self' https://analytics.esse.dev",
				// Turnstile, for sending the agent's drafts: the widget's script and iframe.
				'frame-src https://challenges.cloudflare.com',
				"object-src 'none'",
				"base-uri 'self'"
			],
			scriptDirective: {
				resources: ["'self'", 'https://analytics.esse.dev', 'https://challenges.cloudflare.com'],
				hashes: [
					inlineHash('./src/scripts/theme-init.js'),
					inlineHash('./src/scripts/boot-init.js')
				]
			}
		}
	},
	vite: {
		plugins: [tailwindcss()],
		define: {
			'import.meta.env.BUILD_COMMIT': JSON.stringify(buildCommit),
			'import.meta.env.BUILD_DATE': JSON.stringify(buildDate)
		},
		// In `pnpm dev` the agent reads the site index with `env.ASSETS.fetch` on
		// `https://assets.local/...`, which goes through Vite: without this host it answers 403
		// and the chat stays offline. Deploy and `wrangler dev` do not go through here.
		// `.trycloudflare.com`: the dev server opened on a phone through a Cloudflare quick tunnel
		// (ngrok's free plan answers the fonts with its warning page).
		server: { allowedHosts: ['assets.local', '.trycloudflare.com'] }
	}
});
