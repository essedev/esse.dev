import { expect, type Page, test } from '@playwright/test';

// Il link "Indietro" nelle pagine di dettaglio e contestuale alla provenienza:
// ripercorre la history del browser se si arriva da una pagina interna (home,
// listing, tag...), altrimenti - su atterraggio diretto (link condiviso, nuova
// tab, reload) - ripiega sull'URL della listing. Cfr. BackLink.svelte.
const back = (page: Page) => page.getByRole('link', { name: 'Back' });

// Il link contestuale funziona solo a pagina idratata: prima, SvelteKit non intercetta i
// click e la navigazione è un caricamento completo, che il BackLink tratta (giustamente)
// come atterraggio diretto. Si aspetta la rete ferma prima di cliccare, altrimenti il
// test misura la velocità del dev server invece del comportamento.
const open = (page: Page, url: string) => page.goto(url, { waitUntil: 'networkidle' });

test.describe('contextual back link - projects', () => {
	test('home -> project detail -> back returns to home', async ({ page }) => {
		await open(page, '/en');
		await page.locator('a[href*="/projects/"]').first().click();
		await page.waitForURL(/\/en\/projects\/[^/]+$/);
		await back(page).click();
		await expect(page).toHaveURL(/\/en\/?$/);
	});

	test('projects listing -> project detail -> back returns to the listing', async ({ page }) => {
		await open(page, '/en/projects');
		await page.locator('a[href*="/projects/"]').first().click();
		await page.waitForURL(/\/en\/projects\/[^/]+$/);
		await back(page).click();
		await expect(page).toHaveURL(/\/en\/projects$/);
	});

	test('direct landing on a project -> back falls back to the listing', async ({ page }) => {
		await open(page, '/en/projects/budokan');
		await back(page).click();
		await expect(page).toHaveURL(/\/en\/projects$/);
	});
});

test.describe('contextual back link - articles', () => {
	test('blog listing -> article detail -> back returns to the listing', async ({ page }) => {
		await open(page, '/en/blog');
		await page.locator('a[href*="/blog/"]').first().click();
		await page.waitForURL(/\/en\/blog\/[^/]+$/);
		await back(page).click();
		await expect(page).toHaveURL(/\/en\/blog$/);
	});

	test('direct landing on an article -> back falls back to the listing', async ({ page }) => {
		await open(page, '/en/blog/my-new-laboratory');
		await back(page).click();
		await expect(page).toHaveURL(/\/en\/blog$/);
	});
});
