// @ts-check
import cloudflare from '@astrojs/cloudflare';
import svelte from '@astrojs/svelte';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, fontProviders } from 'astro/config';

// Sito statico: tutte le pagine sono prerenderizzate. Girano sul Worker solo la root
// (sceglie la lingua dal browser) e il catch-all dei redirect i18n, che hanno
// `prerender = false`. Il prerender gira in Node perché le OG usano resvg (nativo).
export default defineConfig({
	site: 'https://esse.dev',
	trailingSlash: 'never',
	build: { format: 'file' },
	adapter: cloudflare({ prerenderEnvironment: 'node', imageService: 'compile' }),
	session: false,
	// Niente evidenziazione del codice per ora: Shiki usa stili inline che la CSP blocca.
	markdown: { syntaxHighlight: false },
	// Immagini responsive anche nel Markdown: srcset generato a build invece dell'originale.
	image: { layout: 'constrained', responsiveStyles: true },
	integrations: [svelte()],
	// Font self-hosted con il Fonts API: file scaricati a build, preload e fallback tarati
	// per ridurre il salto di layout. Le variabili CSS si usano nel @theme di global.css.
	fonts: [
		{ provider: fontProviders.fontsource(), name: 'Geist', cssVariable: '--font-geist' },
		{ provider: fontProviders.fontsource(), name: 'Geist Mono', cssVariable: '--font-geist-mono' },
		// Il mono dell'interfaccia: pixel, leggibile anche piccolo (MIT, licenza accanto al file).
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
				// Turnstile, per l'invio delle bozze dell'agente: script e iframe del widget.
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
		// In `pnpm dev` l'agente legge l'indice del sito con `env.ASSETS.fetch` su
		// `https://assets.local/...`, che passa da Vite: senza questo host risponde 403 e la
		// chat resta offline. Il deploy e `wrangler dev` non passano da qui.
		server: { allowedHosts: ['assets.local'] }
	}
});
