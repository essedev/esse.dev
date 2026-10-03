import { expect, test, type Page } from '@playwright/test';

// Lo script dello spazio di lavoro è un modulo: aspettiamo che sia caricato.
async function open(page: Page, path: string) {
	await page.goto(path);
	await page.waitForLoadState('networkidle');
}

test.describe('workspace keyboard', () => {
	test('j moves through the list and Enter opens the item', async ({ page }) => {
		await open(page, '/en');
		await page.keyboard.press('j');
		const selected = page.locator('[data-nav-item][data-selected]');
		await expect(selected).toHaveCount(1);
		const href = await selected.getAttribute('href');
		await page.keyboard.press('Enter');
		await expect(page).toHaveURL(new RegExp(`${href}$`));
	});

	test('"/" focuses the filter, which narrows the list and opens the first match', async ({
		page
	}) => {
		await open(page, '/en');
		await page.keyboard.press('/');
		const filter = page.locator('[data-filter]');
		await expect(filter).toBeFocused();
		await filter.fill('portsage');
		await expect(page.locator('[data-sidebar] [data-row]:not([hidden])')).toHaveCount(1);
		await page.keyboard.press('Enter');
		await expect(page).toHaveURL(/\/en\/projects\/portsage$/);
	});

	test('the command palette jumps to any item', async ({ page }) => {
		await open(page, '/en');
		await page.keyboard.press('Control+k');
		const input = page.locator('[data-palette-input]');
		await expect(input).toBeFocused();
		await input.fill('nexus');
		await page.keyboard.press('Enter');
		await expect(page).toHaveURL(/\/en\/projects\/nexus$/);
	});

	test('Esc on a detail page goes back to its section', async ({ page }) => {
		await open(page, '/en/projects/relay');
		await page.keyboard.press('Escape');
		await expect(page).toHaveURL(/\/en\/projects$/);
	});

	test('the item being viewed is marked in the list', async ({ page }) => {
		await open(page, '/it/progetti/relay');
		await expect(page.locator('[data-sidebar] [aria-current="page"]')).toHaveAttribute(
			'href',
			'/it/progetti/relay'
		);
	});
});

test.describe('sections and legacy routes', () => {
	test('every section has its page in both languages', async ({ request }) => {
		for (const path of [
			'/en/method',
			'/it/metodo',
			'/en/now',
			'/it/adesso',
			'/en/about',
			'/it/chi-sono',
			'/en/method/context'
		]) {
			const res = await request.get(path, { maxRedirects: 0 });
			expect(res.status(), path).toBe(200);
		}
	});

	test('the old blog route redirects to writing, slug included', async ({ request }) => {
		const res = await request.get('/en/blog/my-new-laboratory', { maxRedirects: 0 });
		expect(res.status()).toBe(302);
		expect(res.headers()['location']).toMatch(/\/en\/writing\/my-new-laboratory$/);
	});
});
