import { expect, test } from '@playwright/test';

// La home e una vetrina curata: i progetti featured (config/featured.json, in
// ordine) davanti, poi i piu recenti a riempire. Il primo progetto mostrato deve
// essere il primo featured (relay), che per data non sarebbe in cima.
test('home shows featured projects first', async ({ page }) => {
	await page.goto('/en');
	const firstProject = page.locator('a[href*="/projects/"]').first();
	await expect(firstProject).toHaveAttribute('href', /\/projects\/relay$/);
});
