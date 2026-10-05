import { expect, test } from '@playwright/test';

// The OG images are pre-generated static PNGs (static/og/). We check that the meta tags
// point to the right file and that the file is actually served.

test.describe('OG images', () => {
	test('homepage og:image points to the static home image (served 200)', async ({
		page,
		request
	}) => {
		await page.goto('/en');
		const ogImage = await page.locator('meta[property="og:image"]').getAttribute('content');
		expect(ogImage).toContain('/og/home.png');
		const res = await request.get(ogImage!);
		expect(res.status()).toBe(200);
		expect(res.headers()['content-type']).toContain('image/png');
	});

	test('project detail og:image points to its static image (served 200)', async ({
		page,
		request
	}) => {
		await page.goto('/en/projects/budokan');
		const ogImage = await page.locator('meta[property="og:image"]').getAttribute('content');
		expect(ogImage).toContain('/og/detail-projects-budokan-en.png');
		const res = await request.get(ogImage!);
		expect(res.status()).toBe(200);
	});
});
