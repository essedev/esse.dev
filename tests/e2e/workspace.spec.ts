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
		const selected = page.locator('[data-nav-item]:focus-visible');
		await expect(selected).toHaveCount(1);
		const href = await selected.getAttribute('href');
		await page.keyboard.press('Enter');
		await expect(page).toHaveURL(new RegExp(`${href}$`));
	});

	test('the j/k highlight goes away with the focus', async ({ page }) => {
		await open(page, '/en');
		await page.keyboard.press('j');
		await page.keyboard.press('j');
		const selected = page.locator('[data-nav-item]:focus-visible');
		await expect(selected).toHaveCount(1);
		const item = (await selected.elementHandle())!;
		// `transition-colors`: il fondo ci mette un attimo ad arrivare e ad andarsene.
		const background = () => item.evaluate((el) => getComputedStyle(el).backgroundColor);
		await expect.poll(background).not.toBe('rgba(0, 0, 0, 0)');
		await page.locator('[data-content]').click({ position: { x: 400, y: 300 } });
		await expect(page.locator('[data-nav-item]:focus')).toHaveCount(0);
		await expect.poll(background).toBe('rgba(0, 0, 0, 0)');
	});

	test('"/" focuses the search, which narrows the list and opens the first match', async ({
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

	test('Cmd/Ctrl+K also brings you to the one search', async ({ page }) => {
		await open(page, '/en/projects/relay');
		await page.keyboard.press('Control+k');
		await expect(page.locator('[data-filter]')).toBeFocused();
	});

	test('Esc on a detail page goes back to its section', async ({ page }) => {
		await open(page, '/en/projects/relay');
		await page.keyboard.press('Escape');
		await expect(page).toHaveURL(/\/en\/projects$/);
	});

	test('l opens the next item and h the previous one', async ({ page }) => {
		await open(page, '/en/projects/nexus');
		const next = await page.locator('[data-pager="next"]').getAttribute('href');
		await page.keyboard.press('l');
		await expect(page).toHaveURL(new RegExp(`${next}$`));
		await page.waitForLoadState('networkidle');
		await page.keyboard.press('h');
		await expect(page).toHaveURL(/\/en\/projects\/nexus$/);
	});

	test('a short page keeps the pager at the bottom of the pane', async ({ page }) => {
		await page.setViewportSize({ width: 1440, height: 900 });
		await open(page, '/en/projects/watch-os');
		const pager = await page.locator('[data-pager]').first().boundingBox();
		expect(pager!.y + pager!.height).toBeGreaterThan(900 - 120);
	});

	test('the wheel scrolls the list all the way down', async ({ page }) => {
		// Con overscroll-behavior su un antenato che non scorre, Chromium si fermava al primo colpo.
		await page.setViewportSize({ width: 1440, height: 760 });
		await open(page, '/en/projects/relay');
		const list = page.locator('[data-sidebar-scroll]');
		await list.evaluate((el) => (el.scrollTop = 0));
		const box = (await list.boundingBox())!;
		await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
		for (let i = 0; i < 12; i++) await page.mouse.wheel(0, 80);
		await expect
			.poll(() => list.evaluate((el) => el.scrollHeight - el.clientHeight - el.scrollTop))
			.toBeLessThan(2);
	});

	test('the wheel over a command scrolls the page', async ({ page }) => {
		// Con overscroll-behavior anche verticale sul blocco, la rotella lì sopra non scorreva.
		await page.setViewportSize({ width: 1440, height: 760 });
		await open(page, '/en/projects/relay');
		const box = (await page.locator('[data-copy] .overflow-x-auto').first().boundingBox())!;
		await page.mouse.move(box.x + 20, box.y + box.height / 2);
		for (let i = 0; i < 3; i++) await page.mouse.wheel(0, 100);
		await expect
			.poll(() => page.locator('[data-main-scroll]').evaluate((el) => el.scrollTop))
			.toBeGreaterThan(100);
	});

	test('the list shows the showcase; search reaches every project', async ({ page }) => {
		await open(page, '/en');
		const watch = page.locator('[data-sidebar] a[href="/en/projects/watch-os"]');
		await expect(watch).toBeHidden();
		await expect(page.locator('[data-sidebar] [data-more] a')).toHaveAttribute(
			'href',
			'/en/projects'
		);
		await page.locator('[data-filter]').fill('watch-os');
		await expect(watch).toBeVisible();
		await expect(page.locator('[data-sidebar] [data-more]')).toBeHidden();
	});

	test('a project outside the showcase appears in the list while it is open', async ({ page }) => {
		await open(page, '/en/projects/watch-os');
		await expect(page.locator('[data-sidebar] [aria-current="page"]')).toBeVisible();
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
