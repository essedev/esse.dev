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
		// ci sono link alle pagine di dettaglio progetto (i card sono lazy/opacity-0,
		// quindi verifichiamo la presenza nel DOM, non la visibilita')
		expect(await page.locator('a[href*="/projects/"]').count()).toBeGreaterThan(0);
	});

	test('/en/progetti (italian route under en) redirects to /en/projects', async ({ page }) => {
		await page.goto('/en/progetti');
		await page.waitForURL('**/en/projects');
		expect(page.url()).toContain('/en/projects');
	});

	test('wrong-language route redirects once, without trailing slash', async ({ request }) => {
		const res = await request.get('/en/progetti', { maxRedirects: 0 });
		expect(res.status()).toBe(302);
		// un solo hop al canonico, niente /en/projects/ con slash finale
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
		// budokan e' "completed": il badge deve comparire anche nel dettaglio, non
		// solo sulle card (StatusBadge condiviso)
		await page.goto('/en/projects/budokan');
		await expect(page.getByText('Completed', { exact: true })).toBeVisible();
	});

	test('the italian detail route (language-switch target) renders', async ({ page }) => {
		// /it/progetti/budokan e' la destinazione dello switch EN->IT (cfr. unit getLanguageUrl)
		const res = await page.goto('/it/progetti/budokan');
		expect(res?.status()).toBe(200);
		await expect(page.locator('h1, h2').first()).toBeVisible();
	});

	test('invalid language with a valid route redirects to the canonical language', async ({
		request
	}) => {
		// /xx/projects -> /en/projects (la route 'projects' appartiene a en)
		const res = await request.get('/xx/projects', { maxRedirects: 0 });
		expect(res.status()).toBe(302);
		expect(res.headers()['location']).toMatch(/\/en\/projects$/);
	});

	test('invalid language carries the slug to the canonical language', async ({ request }) => {
		const res = await request.get('/xx/projects/budokan', { maxRedirects: 0 });
		expect(res.status()).toBe(302);
		expect(res.headers()['location']).toMatch(/\/en\/projects\/budokan$/);
	});

	test('wrong-language route with a slug translates the route and keeps the slug', async ({
		request
	}) => {
		// /en/progetti/budokan -> /en/projects/budokan (slug condiviso tra le lingue)
		const res = await request.get('/en/progetti/budokan', { maxRedirects: 0 });
		expect(res.status()).toBe(302);
		expect(res.headers()['location']).toMatch(/\/en\/projects\/budokan$/);
	});

	test('a canonical detail URL does not redirect (no loop)', async ({ request }) => {
		const res = await request.get('/en/projects/budokan', { maxRedirects: 0 });
		expect(res.status()).toBe(200);
	});
});

test.describe('article slug translation (cross-language)', () => {
	// L'unico contenuto con slug diversi tra le lingue (en: my-new-laboratory,
	// it: il-mio-nuovo-laboratorio): esercita la traduzione slug del hook, che sui
	// progetti non scatta mai perche' i loro slug coincidono tra en e it.
	test('italian article slug under /en redirects to the english slug', async ({ request }) => {
		const res = await request.get('/en/writing/il-mio-nuovo-laboratorio', { maxRedirects: 0 });
		expect(res.status()).toBe(302);
		expect(res.headers()['location']).toMatch(/\/en\/writing\/my-new-laboratory$/);
	});

	test('english article slug under /it redirects to the italian slug', async ({ request }) => {
		const res = await request.get('/it/scritti/my-new-laboratory', { maxRedirects: 0 });
		expect(res.status()).toBe(302);
		expect(res.headers()['location']).toMatch(/\/it\/scritti\/il-mio-nuovo-laboratorio$/);
	});

	test('the english article detail renders at its canonical slug', async ({ page }) => {
		const res = await page.goto('/en/writing/my-new-laboratory');
		expect(res?.status()).toBe(200);
		await expect(page.locator('h1').first()).toBeVisible();
	});

	test('the italian article detail renders at its canonical slug', async ({ page }) => {
		const res = await page.goto('/it/scritti/il-mio-nuovo-laboratorio');
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
});

test.describe('rss', () => {
	test('/en/rss.xml is a valid feed with items', async ({ request }) => {
		const res = await request.get('/en/rss.xml');
		expect(res.status()).toBe(200);
		expect(res.headers()['content-type']).toContain('rss+xml');
		const body = await res.text();
		expect(body).toContain('<rss');
		expect(body).toContain('<channel>');
		expect(body).toContain('<item>');
		expect(body).toContain('/en/writing/');
	});
});
