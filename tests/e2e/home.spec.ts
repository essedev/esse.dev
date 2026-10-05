import { expect, test } from '@playwright/test';

// The project list puts the showcase ones first (config/featured.json, in order): the
// first is relay, which by date would not be on top.
test('the projects group lists featured projects first', async ({ page }) => {
	await page.goto('/en');
	const first = page.locator('[data-group="projects"] [data-row] a').first();
	await expect(first).toHaveAttribute('href', /\/projects\/relay$/);
});
