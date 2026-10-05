// @ts-check
import cloudflare from '@astrojs/cloudflare';
import svelte from '@astrojs/svelte';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, fontProviders } from 'astro/config';

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
				"connect-src 'self' https://umami.essedev.it",
				// Turnstile, for sending the agent's drafts: the widget's script and iframe.
				'frame-src https://challenges.cloudflare.com',
				"object-src 'none'",
				"base-uri 'self'"
			],
			scriptDirective: {
				resources: ["'self'", 'https://umami.essedev.it', 'https://challenges.cloudflare.com']
			}
		}
	},
	vite: {
		plugins: [tailwindcss()],
		// In `pnpm dev` the agent reads the site index with `env.ASSETS.fetch` on
		// `https://assets.local/...`, which goes through Vite: without this host it answers 403
		// and the chat stays offline. Deploy and `wrangler dev` do not go through here.
		server: { allowedHosts: ['assets.local'] }
	}
});
