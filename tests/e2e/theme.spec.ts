import { expect, test } from '@playwright/test';

test.describe('theme', () => {
	test('follows the system before any choice', async ({ page }) => {
		await page.emulateMedia({ colorScheme: 'light' });
		await page.goto('/en');
		await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
	});

	test('the toggle flips the theme and the choice survives a reload', async ({ page }) => {
		await page.emulateMedia({ colorScheme: 'dark' });
		await page.goto('/en');
		await page.waitForLoadState('networkidle');
		const html = page.locator('html');
		const toggle = page.locator('[data-theme-toggle]');
		await expect(html).toHaveAttribute('data-theme', 'dark');
		await expect(toggle).toHaveAttribute('aria-label', 'Switch to the light theme');

		await toggle.click();
		await expect(html).toHaveAttribute('data-theme', 'light');
		await expect(toggle).toHaveAttribute('aria-label', 'Switch to the dark theme');
		const textColor = () => page.evaluate(() => getComputedStyle(document.body).color);
		const lightText = await textColor();

		await page.reload();
		await expect(html).toHaveAttribute('data-theme', 'light');
		expect(await textColor()).toBe(lightText);
	});

	test('choosing the system theme again goes back to following it', async ({ page }) => {
		await page.emulateMedia({ colorScheme: 'dark' });
		await page.goto('/en');
		await page.waitForLoadState('networkidle');
		const toggle = page.locator('[data-theme-toggle]');
		await toggle.click();
		await toggle.click();
		expect(await page.evaluate(() => localStorage.getItem('theme'))).toBeNull();

		await page.emulateMedia({ colorScheme: 'light' });
		await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
	});
});
