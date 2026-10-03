import { expect, test } from '@playwright/test';

test.describe('listing filters', () => {
	test('a tag in the URL filters the list and survives the island hydration', async ({ page }) => {
		await page.goto('/en/projects?tag=Swift');
		const cards = page.locator('main a[href*="/en/projects/"]');
		await expect(cards.first()).toBeVisible();
		await expect(page).toHaveURL(/tag=Swift/);
		const all = await page.request.get('/en/projects');
		const total = ((await all.text()).match(/href="\/en\/projects\/[^"]+"/g) ?? []).length;
		expect(await cards.count()).toBeLessThan(total);
	});

	test('typing in search narrows the list and writes the query string', async ({ page }) => {
		await page.goto('/en/projects');
		await page.getByRole('searchbox').fill('relay');
		await expect(page).toHaveURL(/q=relay/);
		await expect(page.locator('main a[href*="/en/projects/"]')).toHaveCount(1);
	});
});

test.describe('hardening', () => {
	test('pages carry a CSP meta tag and security headers', async ({ page }) => {
		const res = await page.goto('/en');
		expect(res?.headers()['x-content-type-options']).toBe('nosniff');
		expect(res?.headers()['content-security-policy']).toContain("frame-ancestors 'none'");
		const csp = await page
			.locator('meta[http-equiv="content-security-policy"]')
			.getAttribute('content');
		expect(csp).toContain("default-src 'self'");
	});

	test('the 404 page is localized and not indexable', async ({ page }) => {
		const res = await page.goto('/it/progetti/non-esiste');
		expect(res?.status()).toBe(404);
		await expect(page.getByRole('heading', { level: 1 })).toHaveText('Pagina non trovata');
		await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
	});
});
