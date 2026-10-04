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

	test('the index opens as a drawer and closes with Esc, the X and a tap outside', async ({
		page
	}) => {
		await open(page, '/it/progetti/relay');
		const sidebar = page.locator('[data-sidebar]');
		const toggle = page.getByRole('button', { name: "Apri l'indice" });
		await expect(toggle).toHaveAttribute('aria-expanded', 'false');

		await toggle.click();
		await expect(sidebar).toBeVisible();
		await expect(toggle).toHaveAttribute('aria-expanded', 'true');
		await expect(page.locator('[data-content]')).toHaveAttribute('inert', '');
		await page.keyboard.press('Escape');
		await expect(sidebar).toBeHidden();
		await expect(page).toHaveURL(/\/it\/progetti\/relay$/);

		await toggle.click();
		await page.getByRole('button', { name: 'Chiudi' }).click();
		await expect(sidebar).toBeHidden();

		await toggle.click();
		await page.mouse.click(380, 420);
		await expect(sidebar).toBeHidden();
		await expect(page.locator('[data-content]')).not.toHaveAttribute('inert', '');
	});

	test('a finger swipe to the left closes the drawer, a vertical one scrolls the list', async ({
		page
	}) => {
		await open(page, '/it/progetti/relay');
		await page.getByRole('button', { name: "Apri l'indice" }).click();
		const workspace = page.locator('[data-workspace]');
		await expect(workspace).toHaveAttribute('data-drawer', 'open');
		// Tocchi veri via CDP: generano pointer event di tipo touch, come un dito.
		const cdp = await page.context().newCDPSession(page);
		const touch = (type: 'touchStart' | 'touchMove' | 'touchEnd', x = 0, y = 0) =>
			cdp.send('Input.dispatchTouchEvent', {
				type,
				touchPoints: type === 'touchEnd' ? [] : [{ x, y }]
			});
		await touch('touchStart', 150, 600);
		for (let y = 580; y >= 300; y -= 20) await touch('touchMove', 152, y);
		await touch('touchEnd');
		await expect(workspace).toHaveAttribute('data-drawer', 'open');
		await expect
			.poll(() => page.locator('[data-sidebar-scroll]').evaluate((el) => el.scrollTop))
			.toBeGreaterThan(50);
		await touch('touchStart', 250, 400);
		for (let x = 240; x >= 40; x -= 20) await touch('touchMove', x, 402);
		await touch('touchEnd');
		await expect(workspace).not.toHaveAttribute('data-drawer');
	});

	test('the search button opens the drawer on the search field', async ({ page }) => {
		await open(page, '/it/metodo');
		await page.getByRole('button', { name: 'Cerca' }).click();
		await expect(page.locator('#search')).toBeFocused();
		await page.keyboard.type('relay');
		await page.locator('[data-sidebar] a[href="/it/progetti/relay"]').click();
		await expect(page).toHaveURL(/\/it\/progetti\/relay$/);
	});

	test('a section goes up to the home', async ({ page }) => {
		await open(page, '/it/metodo');
		await page.getByRole('link', { name: 'esse.dev', exact: true }).click();
		await expect(page).toHaveURL(/\/it$/);
	});
});
