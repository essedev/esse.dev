import { defineConfig, devices } from '@playwright/test';

// E2E tests run against the real build served by wrangler (same Worker and same assets as
// production): redirects, headers, 404 and CSP behave as they do online, which the Astro dev
// server does not guarantee. Dedicated port (:8788) and no reuse: a server already running
// would serve an old build, and the preview on :8787 stays free.
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
		// Ready when the Worker answers, not only the static assets: /en/progetti goes through
		// the redirect catch-all, and the Worker's first response arrives once compilation is done.
		url: 'http://localhost:8788/en/progetti',
		reuseExistingServer: false,
		timeout: 240_000
	}
});
