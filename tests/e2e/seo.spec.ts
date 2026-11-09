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

test.describe('writing', () => {
	const ARTICLE = '/en/writing/what-happens-when-you-write-to-my-agent';

	test('the section is in the sidebar and the sitemap', async ({ page, request }) => {
		const res = await page.goto('/en/writing');
		expect(res?.status()).toBe(200);
		await expect(page.locator('a[href="/en/writing"]').first()).toBeAttached();
		const sitemap = await (await request.get('/sitemap.xml')).text();
		expect(sitemap).toContain(ARTICLE);
	});

	test('an article carries its BlogPosting data', async ({ page }) => {
		await page.goto(ARTICLE);
		const json = await page.locator('script[type="application/ld+json"]').first().textContent();
		const data = JSON.parse(json ?? '{}');
		const types = (Array.isArray(data) ? data : [data]).map((d) => d['@type']);
		expect(types).toContain('BlogPosting');
	});

	test('an article draws its diagram and charts within the CSP', async ({ page }) => {
		const violations: string[] = [];
		page.on('console', (message) => {
			if (message.type() === 'error' && /content security policy/i.test(message.text())) {
				violations.push(message.text());
			}
		});
		await page.goto(ARTICLE);
		await expect(page.locator('article figure')).toHaveCount(3);
		await expect(page.locator('article figure ol li')).toHaveCount(5);
		await expect(page.locator('article figure table')).toBeVisible();
		await expect(page.locator('article figure svg').first()).toBeVisible();
		expect(violations).toEqual([]);
	});

	test('a photo sits beside the text on a wide column and above it on a narrow one', async ({
		page
	}) => {
		const photo = page.locator('article img[alt^="Drawings of robots"]');
		const text = page.locator('article .prose p', { hasText: 'mad scientist' });
		await page.setViewportSize({ width: 1440, height: 900 });
		await page.goto('/en/writing/the-orange-binder');
		const wide = { photo: await photo.boundingBox(), text: await text.boundingBox() };
		expect(wide.photo!.y).toBeLessThan(wide.text!.y + wide.text!.height);
		expect(wide.photo!.x).toBeGreaterThan(wide.text!.x + 100);
		await expect(page.locator('article figure figcaption').first()).toContainText('Robots built');

		await page.setViewportSize({ width: 390, height: 844 });
		await page.goto('/en/writing/the-orange-binder');
		const narrow = { photo: await photo.boundingBox(), text: await text.boundingBox() };
		expect(narrow.photo!.y + narrow.photo!.height).toBeLessThanOrEqual(narrow.text!.y);
	});

	test('the attempts timeline reads the project and ends on it', async ({ page }) => {
		await page.goto('/en/writing/the-orange-binder');
		const timeline = page.locator('article figure ol li');
		await expect(timeline.first().locator('.led')).toHaveAttribute('data-status', 'archived');
		await expect(timeline.last()).toContainText('Nexus');
		await expect(timeline.last().locator('.led')).not.toHaveAttribute('data-status', 'archived');
		await expect(page.locator('article img[alt^="Drawings of robots"]')).toBeVisible();
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
