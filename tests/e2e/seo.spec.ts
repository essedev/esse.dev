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

	test('article detail alternate points to the translated slug', async ({ page }) => {
		await page.goto('/en/writing/my-new-laboratory');
		const itAlt = await page.locator('link[rel="alternate"][hreflang="it"]').getAttribute('href');
		expect(itAlt).toContain('/it/scritti/il-mio-nuovo-laboratorio');
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

	test('article detail emits BlogPosting with headline and dates', async ({ page }) => {
		await page.goto('/en/writing/my-new-laboratory');
		const raw = await page.locator('script[type="application/ld+json"]').first().textContent();
		const data = JSON.parse(raw!);
		const post = Array.isArray(data) ? data[0] : data;
		expect(post['@type']).toBe('BlogPosting');
		expect(post.headline).toBeTruthy();
		expect(post.datePublished).toBeTruthy();
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
