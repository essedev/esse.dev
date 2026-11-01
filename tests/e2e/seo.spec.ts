import { expect, test } from '@playwright/test';

test.describe('canonical & hreflang', () => {
	test('homepage exposes canonical and alternate hreflang (en, it, x-default)', async ({
		page
	}) => {
		await page.goto('/en');

		const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
		expect(canonical).toMatch(/\/en$/);

		const hreflangs = await page
			.locator('link[rel="alternate"]')
			.evaluateAll((nodes) => nodes.map((n) => n.getAttribute('hreflang')));
		expect(hreflangs).toEqual(expect.arrayContaining(['en', 'it', 'x-default']));
	});

	test('detail alternate points to the translated slug', async ({ page }) => {
		await page.goto('/en/method/measure');
		const itAlt = await page.locator('link[rel="alternate"][hreflang="it"]').getAttribute('href');
		expect(itAlt).toContain('/it/metodo/misurare');
	});
});

test.describe('structured data (JSON-LD)', () => {
	test('homepage emits WebSite + Person', async ({ page }) => {
		await page.goto('/en');
		const raw = await page.locator('script[type="application/ld+json"]').first().textContent();
		const data = JSON.parse(raw!);
		const types = (Array.isArray(data) ? data : [data]).map((d) => d['@type']);
		expect(types).toEqual(expect.arrayContaining(['WebSite', 'Person']));
	});
});

// No article is published today: writing has no page, no sidebar row and no sitemap entry.
// When the next article arrives, this block becomes the BlogPosting check on its page
// (the JSON-LD helper is covered in tests/unit/seo.test.ts meanwhile).
test.describe('writing without articles', () => {
	test('the section answers 404 and is not in the sidebar or the sitemap', async ({
		page,
		request
	}) => {
		const res = await page.goto('/en/writing');
		expect(res?.status()).toBe(404);
		await page.goto('/en');
		await expect(page.locator('a[href="/en/writing"]')).toHaveCount(0);
		const sitemap = await (await request.get('/sitemap.xml')).text();
		expect(sitemap).not.toContain('/en/writing');
	});
});

test.describe('accessibility', () => {
	test('a skip-to-content link targets the main landmark', async ({ page }) => {
		await page.goto('/en');
		const skip = page.locator('a.skip-link');
		await expect(skip).toHaveAttribute('href', '#main-content');
		expect(await page.locator('main#main-content').count()).toBe(1);
	});
});
