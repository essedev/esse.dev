import { defineConfig, devices } from '@playwright/test';

// E2E contro la build vera servita da wrangler (stesso Worker e stessi asset della
// produzione): redirect, header, 404 e CSP si comportano come online, cosa che il dev
// server di Astro non garantisce. Porta dedicata (:8788) e niente riuso: un server già
// acceso servirebbe una build vecchia, e l'anteprima su :8787 resta libera.
export default defineConfig({
	testDir: 'tests/e2e',
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 1 : 0,
	reporter: process.env.CI ? 'list' : 'line',
	use: {
		baseURL: 'http://localhost:8788',
		trace: 'on-first-retry'
	},
	projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
	webServer: {
		command: 'pnpm build && pnpm exec wrangler dev --port 8788',
		// Pronto quando risponde il Worker, non solo gli asset statici: /en/progetti passa dal
		// catch-all dei redirect, e la prima risposta del Worker arriva a compilazione finita.
		url: 'http://localhost:8788/en/progetti',
		reuseExistingServer: false,
		timeout: 240_000
	}
});
