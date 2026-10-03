import { expect, test } from '@playwright/test';

// La lista dei progetti mette davanti quelli in vetrina (config/featured.json, in ordine):
// il primo è relay, che per data non sarebbe in cima.
test('the projects group lists featured projects first', async ({ page }) => {
	await page.goto('/en');
	const first = page.locator('[data-group="projects"] [data-row] a').first();
	await expect(first).toHaveAttribute('href', /\/projects\/relay$/);
});
