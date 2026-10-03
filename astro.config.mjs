// @ts-check
import cloudflare from '@astrojs/cloudflare';
import svelte from '@astrojs/svelte';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';

// Sito statico: tutte le pagine sono prerenderizzate. Girano sul Worker solo la root
// (sceglie la lingua dal browser) e il catch-all dei redirect i18n, che hanno
// `prerender = false`. Il prerender gira in Node perché le OG usano resvg (nativo).
export default defineConfig({
	site: 'https://simonesalerno.it',
	trailingSlash: 'never',
	build: { format: 'file' },
	adapter: cloudflare({ prerenderEnvironment: 'node', imageService: 'compile' }),
	session: false,
	// Niente evidenziazione del codice per ora: Shiki usa stili inline che la CSP blocca.
	markdown: { syntaxHighlight: false },
	integrations: [svelte()],
	security: {
		csp: {
			directives: [
				"default-src 'self'",
				"img-src 'self' data:",
				"font-src 'self'",
				"connect-src 'self' https://umami.essedev.it",
				"object-src 'none'",
				"base-uri 'self'"
			],
			scriptDirective: { resources: ["'self'", 'https://umami.essedev.it'] }
		}
	},
	vite: {
		plugins: [tailwindcss()]
	}
});
