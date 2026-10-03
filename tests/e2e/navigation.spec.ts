import { expect, type Page, test } from '@playwright/test';

// Il livello sopra (breadcrumb, Esc, "‹" su mobile) porta sempre al genitore della
// pagina. Se si arriva proprio da lì torna con la history, così il registro ritrova i
// filtri; altrimenti (atterraggio diretto, arrivo da un'altra pagina) apre il link.
const crumbUp = (page: Page) => page.locator('nav[aria-label="Percorso"] a[data-up]');

async function open(page: Page, path: string) {
	await page.goto(path);
	await page.waitForLoadState('networkidle');
}

test.describe('up one level', () => {
	test('filtered registry -> detail -> breadcrumb returns to the registry with its filters', async ({
		page
	}) => {
		await open(page, '/en/projects?status=in-progress');
		await page.locator('main a[href*="/projects/"]').first().click();
		await page.waitForURL(/\/en\/projects\/[^/?]+$/);
		await crumbUp(page).click();
		await expect(page).toHaveURL(/\/en\/projects\?status=in-progress$/);
	});

	test('Esc behaves like the breadcrumb', async ({ page }) => {
		await open(page, '/en/writing?tag=Routing');
		await page.locator('main a[href*="/writing/"]').first().click();
		await page.waitForURL(/\/en\/writing\/[^/?]+$/);
		await page.waitForLoadState('networkidle');
		await page.keyboard.press('Escape');
		await expect(page).toHaveURL(/\/en\/writing\?tag=Routing$/);
	});

	test('home -> project detail -> up goes to the section, not back home', async ({ page }) => {
		await open(page, '/en');
		await page.locator('main a[href*="/projects/"]').first().click();
		await page.waitForURL(/\/en\/projects\/[^/]+$/);
		await crumbUp(page).click();
		await expect(page).toHaveURL(/\/en\/projects$/);
	});

	test('direct landing on an article -> up opens the listing', async ({ page }) => {
		await open(page, '/en/writing/my-new-laboratory');
		await crumbUp(page).click();
		await expect(page).toHaveURL(/\/en\/writing$/);
	});
});

test.describe('mobile toolbar', () => {
	test.use({ viewport: { width: 390, height: 844 } });

	test('a detail shows "‹ section" instead of the list', async ({ page }) => {
		await open(page, '/it/progetti/relay');
		await expect(page.locator('[data-sidebar]')).toBeHidden();
		const up = page.getByRole('link', { name: 'progetti', exact: true });
		await expect(up).toBeVisible();
		await up.click();
		await expect(page).toHaveURL(/\/it\/progetti$/);
	});

	test('a section goes up to the home', async ({ page }) => {
		await open(page, '/it/metodo');
		await page.getByRole('link', { name: 'esse.dev', exact: true }).click();
		await expect(page).toHaveURL(/\/it$/);
	});
});
