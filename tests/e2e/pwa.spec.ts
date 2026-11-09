import { expect, test, type Page } from '@playwright/test';

// The installable site (DECISIONS #47): a manifest per language, and a service worker that
// keeps the visited pages readable offline and answers the others with the offline page.
test.describe('pwa', () => {
	test.use({ serviceWorkers: 'allow' });

	test('each language links its own manifest, complete for the install dialogs', async ({
		page,
		request
	}) => {
		for (const [lang, projects] of [
			['it', 'Progetti'],
			['en', 'Projects']
		]) {
			await page.goto(`/${lang}`);
			const href = await page.locator('link[rel="manifest"]').getAttribute('href');
			expect(href).toBe(`/${lang}/manifest.webmanifest`);
			const res = await request.get(href!);
			expect(res.headers()['content-type']).toContain('application/manifest+json');
			const manifest = await res.json();
			expect(manifest).toMatchObject({ id: '/', scope: '/', start_url: `/${lang}`, lang });
			expect(manifest.display).toBe('standalone');
			expect(manifest.shortcuts.map((s: { name: string }) => s.name)).toContain(projects);
			const purposes = manifest.icons.map((i: { purpose: string }) => i.purpose);
			expect(purposes).toEqual(expect.arrayContaining(['any', 'maskable']));
			const forms = manifest.screenshots.map((s: { form_factor: string }) => s.form_factor);
			expect(forms).toEqual(expect.arrayContaining(['narrow', 'wide']));
			for (const { src } of [
				...manifest.icons,
				...manifest.screenshots,
				...manifest.shortcuts.map((s: { url: string }) => ({ src: s.url }))
			]) {
				expect((await request.get(src)).ok(), src).toBe(true);
			}
		}
	});

	/** Opens `path` and waits until the service worker controls the page. */
	async function controlled(page: Page, path: string) {
		await page.goto(path);
		await page.evaluate(() => navigator.serviceWorker.ready);
		// The first visit installs the worker; it takes the page over with `clients.claim`.
		await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
	}

	test('offline, a visited page is read from the cache', async ({ page, context }) => {
		await controlled(page, '/it');
		await page.goto('/it/metodo');
		await expect(page.getByRole('heading', { level: 1 })).toHaveText('Metodo');
		// The copy is stored after the response: wait until it is in the cache.
		await expect
			.poll(() => page.evaluate(async () => !!(await caches.match('/it/metodo'))))
			.toBe(true);

		await context.setOffline(true);
		await page.goto('/it/metodo');
		await expect(page.getByRole('heading', { level: 1 })).toHaveText('Metodo');
		// The stylesheet comes from the cache too: the page is laid out, not bare HTML.
		await expect(page.locator('[data-pane-glass]')).toHaveCSS('backdrop-filter', /blur/);
	});

	test('offline, a page never visited gets the offline page with the kept ones', async ({
		page,
		context
	}) => {
		await controlled(page, '/it');
		await page.goto('/it/metodo');
		await expect
			.poll(() => page.evaluate(async () => !!(await caches.match('/it/metodo'))))
			.toBe(true);

		await context.setOffline(true);
		await page.goto('/it/progetti/relay');
		await expect(page).toHaveURL(/\/it\/progetti\/relay$/);
		await expect(page.locator('.signal')).toHaveText('offline');
		await expect(page.getByRole('heading', { level: 1 })).toHaveText('Sei offline');
		const kept = page.locator('[data-offline-pages] a');
		await expect(kept.filter({ hasText: 'Metodo' })).toHaveAttribute('href', '/it/metodo');
		await expect(page.locator('[data-offline-pages] a[href="/it/progetti/relay"]')).toHaveCount(0);
	});

	test('the offline page is not indexable and stays out of the sitemap', async ({
		page,
		request
	}) => {
		await page.goto('/en/offline');
		await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
		expect(await (await request.get('/sitemap.xml')).text()).not.toContain('/offline');
	});
});
