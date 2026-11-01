import { expect, test } from '@playwright/test';

test.describe('i18n routing & redirects', () => {
	test('/ honors Accept-Language (it -> /it, otherwise /en)', async ({ request }) => {
		const it = await request.get('/', {
			headers: { 'Accept-Language': 'it-IT,it;q=0.9' },
			maxRedirects: 0
		});
		expect(it.status()).toBe(302);
		expect(it.headers()['location']).toMatch(/\/it$/);

		const fr = await request.get('/', {
			headers: { 'Accept-Language': 'fr-FR,fr;q=0.9' },
			maxRedirects: 0
		});
		expect(fr.status()).toBe(302);
		expect(fr.headers()['location']).toMatch(/\/en$/);
	});

	test('unknown single segment redirects to /en', async ({ page }) => {
		await page.goto('/totally-unknown');
		expect(page.url()).toMatch(/\/en(\/|$)/);
	});

	test('/en/projects serves the projects listing', async ({ page }) => {
		const res = await page.goto('/en/projects');
		expect(res?.status()).toBe(200);
		expect(page.url()).toContain('/en/projects');
		// there are links to the project detail pages (cards are lazy/opacity-0, so we check
		// presence in the DOM, not visibility)
		expect(await page.locator('a[href*="/projects/"]').count()).toBeGreaterThan(0);
	});

	test('/en/progetti (italian route under en) redirects to /en/projects', async ({ page }) => {
		await page.goto('/en/progetti');
		await page.waitForURL('**/en/projects');
		expect(page.url()).toContain('/en/projects');
	});

	test('wrong-language route redirects once, without trailing slash', async ({ request }) => {
		const res = await request.get('/en/progetti', { maxRedirects: 0 });
		expect(res.status()).toBe(301);
		// a single hop to the canonical, no /en/projects/ with a trailing slash
		expect(res.headers()['location']).toMatch(/\/en\/projects$/);
	});

	test('unknown detail slug returns 404', async ({ page }) => {
		const res = await page.goto('/en/projects/does-not-exist-xyz');
		expect(res?.status()).toBe(404);
	});

	test('a real project detail page renders', async ({ page }) => {
		const res = await page.goto('/en/projects/budokan');
		expect(res?.status()).toBe(200);
		await expect(page.locator('h1, h2').first()).toBeVisible();
	});

	test('the project detail page shows the status badge', async ({ page }) => {
		// The badge must show in the detail too, not only on the cards (shared StatusBadge);
		// "maintained" is the most recent status, the first one to be forgotten.
		await page.goto('/en/projects/portsage');
		await expect(page.getByText('Maintained', { exact: true })).toBeVisible();
	});

	test('the italian detail route (language-switch target) renders', async ({ page }) => {
		// /it/progetti/budokan is the destination of the EN->IT switch (see the getLanguageUrl unit test)
		const res = await page.goto('/it/progetti/budokan');
		expect(res?.status()).toBe(200);
		await expect(page.locator('h1, h2').first()).toBeVisible();
	});

	test('invalid language with a valid route redirects to the canonical language', async ({
		request
	}) => {
		// /xx/projects -> /en/projects (the route 'projects' belongs to en)
		const res = await request.get('/xx/projects', { maxRedirects: 0 });
		expect(res.status()).toBe(301);
		expect(res.headers()['location']).toMatch(/\/en\/projects$/);
	});

	test('invalid language carries the slug to the canonical language', async ({ request }) => {
		const res = await request.get('/xx/projects/budokan', { maxRedirects: 0 });
		expect(res.status()).toBe(301);
		expect(res.headers()['location']).toMatch(/\/en\/projects\/budokan$/);
	});

	test('wrong-language route with a slug translates the route and keeps the slug', async ({
		request
	}) => {
		// /en/progetti/budokan -> /en/projects/budokan (slug shared across languages)
		const res = await request.get('/en/progetti/budokan', { maxRedirects: 0 });
		expect(res.status()).toBe(301);
		expect(res.headers()['location']).toMatch(/\/en\/projects\/budokan$/);
	});

	test('a canonical detail URL does not redirect (no loop)', async ({ request }) => {
		const res = await request.get('/en/projects/budokan', { maxRedirects: 0 });
		expect(res.status()).toBe(200);
	});
});

test.describe('detail slug translation (cross-language)', () => {
	// The method notes have different slugs across languages (en: measure, it: misurare): they
	// exercise the hook's slug translation, which never fires on projects because their slugs
	// are the same in en and it.
	test('italian slug under /en redirects to the english slug', async ({ request }) => {
		const res = await request.get('/en/method/misurare', { maxRedirects: 0 });
		expect(res.status()).toBe(301);
		expect(res.headers()['location']).toMatch(/\/en\/method\/measure$/);
	});

	test('english slug under /it redirects to the italian slug', async ({ request }) => {
		const res = await request.get('/it/metodo/measure', { maxRedirects: 0 });
		expect(res.status()).toBe(301);
		expect(res.headers()['location']).toMatch(/\/it\/metodo\/misurare$/);
	});

	test('the english detail renders at its canonical slug', async ({ page }) => {
		const res = await page.goto('/en/method/measure');
		expect(res?.status()).toBe(200);
		await expect(page.locator('h1').first()).toBeVisible();
	});

	test('the italian detail renders at its canonical slug', async ({ page }) => {
		const res = await page.goto('/it/metodo/misurare');
		expect(res?.status()).toBe(200);
		await expect(page.locator('h1').first()).toBeVisible();
	});
});

test.describe('sitemap', () => {
	test('sitemap.xml is well-formed and includes both languages with hreflang', async ({
		request
	}) => {
		const res = await request.get('/sitemap.xml');
		expect(res.status()).toBe(200);
		expect(res.headers()['content-type']).toContain('xml');
		const body = await res.text();
		expect(body).toContain('<urlset');
		expect(body).toContain('/en');
		expect(body).toContain('/it');
		expect(body).toContain('hreflang');
		expect(body).toContain('x-default');
	});

	test('sitemap.xml links a stylesheet built from the tokens, with a font that loads', async ({
		request
	}) => {
		const xml = await (await request.get('/sitemap.xml')).text();
		expect(xml).toMatch(
			/^<\?xml version="1\.0" encoding="UTF-8"\?>\n<\?xml-stylesheet type="text\/css" href="\/sitemap\.css"\?>\n<urlset/
		);

		const res = await request.get('/sitemap.css');
		expect(res.status()).toBe(200);
		expect(res.headers()['content-type']).toContain('text/css');
		const css = await res.text();
		expect(css).toMatch(/--color-accent: #[0-9a-f]{6};/);
		expect(css).toContain('@media (prefers-color-scheme: light)');
		expect(css).not.toMatch(/\$\{|undefined|NaN/);

		const font = /src: url\('([^']+\.woff2)'\)/.exec(css)?.[1];
		expect(font).toBeTruthy();
		const fontRes = await request.get(font!);
		expect(fontRes.status()).toBe(200);
		expect(fontRes.headers()['content-type']).toContain('font/woff2');
	});
});

test.describe('rss', () => {
	// The feed stays up with no article, so subscribers keep it: valid and empty today.
	// With the next article it gets back `<item>` and a `/en/writing/` link.
	test('/en/rss.xml is a valid feed', async ({ request }) => {
		const res = await request.get('/en/rss.xml');
		expect(res.status()).toBe(200);
		expect(res.headers()['content-type']).toContain('rss+xml');
		const body = await res.text();
		expect(body).toContain('<rss');
		expect(body).toContain('<channel>');
	});
});
