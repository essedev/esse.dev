import { expect, test } from '@playwright/test';

// The error pages (concept G): the 404 suggests the closest pages, the list search and the
// agent; the 500 shows the request code and nothing about the error.
test.describe('error pages', () => {
	test('a typo in the route suggests the section', async ({ page }) => {
		const res = await page.goto('/it/progeti');
		expect(res?.status()).toBe(404);
		await expect(page.locator('.signal')).toHaveText('404');
		await expect(page.getByText('/it/progeti', { exact: true })).toBeVisible();
		const suggestions = page.locator('[data-suggestions] a');
		await expect(suggestions.first()).toHaveAttribute('href', '/it/progetti');
	});

	test('a typo in the slug suggests the project and its section', async ({ page }) => {
		await page.goto('/it/progetti/portsag');
		const suggestions = page.locator('[data-suggestions] a');
		await expect(suggestions.nth(0)).toHaveAttribute('href', '/it/progetti/portsage');
		await expect(suggestions.nth(1)).toHaveAttribute('href', '/it/progetti');
		await suggestions.nth(0).click();
		await expect(page).toHaveURL(/\/it\/progetti\/portsage$/);
	});

	test('with nothing close, the search and the agent remain', async ({ page }) => {
		await page.goto('/en/wp-admin/setup.php');
		await expect(page.locator('[data-suggestions]')).toHaveCount(0);
		await expect(page.getByText('There is nothing here, and nothing like it.')).toBeVisible();
		const search = page.getByRole('link', { name: /search “wp admin setup” in the list/ });
		await expect(search).toHaveAttribute('href', '/en?q=wp%20admin%20setup#search');
		await page.getByRole('link', { name: 'ask the agent' }).click();
		await expect(page).toHaveURL(/\/en\/agent$/);
		await expect(page.locator('[data-agent-input]')).toHaveValue(/\/en\/wp-admin\/setup\.php/);
	});

	test('the 500 is in the workspace, not indexable and without details', async ({ page }) => {
		const res = await page.goto('/500');
		expect(res?.status()).toBe(500);
		await expect(page.locator('.signal[data-noise]')).toHaveText('500');
		await expect(page.getByRole('heading', { level: 1 })).toHaveText('Something broke');
		await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
		await expect(page.getByRole('link', { name: 'reload' })).toHaveAttribute('href', '/500');
	});
});
