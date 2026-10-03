import { expect, test, type Page } from '@playwright/test';

const cards = (page: Page) => page.locator('main a[href*="/en/projects/"]');

// I controlli sono un'isola Svelte: finché non è idratata (Astro toglie l'attributo
// `ssr`) un clic non fa niente. Con il server a freddo succede davvero.
async function open(page: Page, path: string) {
	await page.goto(path);
	await page.locator('astro-island:not([ssr])').first().waitFor({ state: 'attached' });
}

test.describe('listing filters', () => {
	test('a tag in the URL filters the list after hydration', async ({ page }) => {
		const total = await (async () => {
			await open(page, '/en/projects');
			return cards(page).count();
		})();
		await open(page, '/en/projects?tag=Swift');
		await expect(page.getByRole('button', { name: 'Remove filter: Swift' })).toBeVisible();
		expect(await cards(page).count()).toBeLessThan(total);
	});

	test('typing in search narrows the list and writes the query string', async ({ page }) => {
		await open(page, '/en/projects');
		await page.locator('main').getByRole('searchbox').fill('relay');
		await expect(page).toHaveURL(/q=relay/);
		await expect(cards(page)).toHaveCount(1);
	});

	test('tags: searchable multi-select driven by the keyboard', async ({ page }) => {
		await open(page, '/en/projects');
		const trigger = page.getByRole('button', { name: /^Tags/ });
		await trigger.focus();
		await page.keyboard.press('ArrowDown');
		const combo = page.getByRole('combobox');
		await expect(combo).toBeFocused();
		await combo.fill('swif');
		// Swift e SwiftUI: l'opzione attiva è la prima, ordinata per frequenza.
		await expect(page.getByRole('option')).toHaveCount(2);
		await expect(page.getByRole('option').first()).toContainText('Swift');
		await page.keyboard.press('Enter');
		await combo.fill('rust');
		await page.keyboard.press('Enter');
		await page.keyboard.press('Escape');
		await expect(trigger).toBeFocused();
		await expect(page).toHaveURL(/tag=Swift&tag=Rust/);
		await expect(page.getByRole('button', { name: 'Remove filter: Rust' })).toBeVisible();
	});

	test('status multi-select and sort single-select', async ({ page }) => {
		await open(page, '/en/projects');
		await page.getByRole('button', { name: 'Status', exact: true }).click();
		await page.getByRole('option', { name: /Idea/ }).click();
		await page.getByRole('option', { name: /Archived/ }).click();
		await expect(page.getByRole('listbox')).toBeVisible();
		await page.locator('h1').click();
		await expect(page.getByRole('listbox')).toBeHidden();
		await expect(page).toHaveURL(/status=idea&status=archived/);

		await page.getByRole('button', { name: /^Sort/ }).click();
		await page.getByRole('option', { name: 'Title a-z' }).click();
		await expect(page.getByRole('listbox')).toBeHidden();
		await expect(page).toHaveURL(/sort=title/);

		await page.getByRole('button', { name: 'Clear filters' }).click();
		await expect(page).toHaveURL(/\/en\/projects$/);
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
		// Risposta del Worker: gli header arrivano dal middleware, non da _headers.
		expect(res?.headers()['x-content-type-options']).toBe('nosniff');
		expect(res?.headers()['content-security-policy']).toContain("frame-ancestors 'none'");
		await expect(page.getByRole('heading', { level: 1 })).toHaveText('Pagina non trovata');
		await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
	});
});
