import { defineConfig, devices } from '@playwright/test';

// E2E contro la build vera servita da wrangler (stesso Worker e stessi asset della
// produzione): redirect, header, 404 e CSP si comportano come online, cosa che il dev
// server di Astro non garantisce. Headless di default; --headed per vedere il browser.
export default defineConfig({
	testDir: 'tests/e2e',
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 1 : 0,
	reporter: process.env.CI ? 'list' : 'line',
	use: {
		baseURL: 'http://localhost:8787',
		trace: 'on-first-retry'
	},
	projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
	webServer: {
		command: 'pnpm build && pnpm exec wrangler dev --port 8787',
		port: 8787,
		reuseExistingServer: !process.env.CI,
		timeout: 240_000
	}
});
