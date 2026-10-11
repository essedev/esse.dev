import { expect, type Page, test } from '@playwright/test';

// The level up (breadcrumb, Esc, "‹" on mobile) always leads to the page's parent. If you
// came from there it goes back through history, so the registry finds its filters again;
// otherwise (direct landing, arrival from another page) it opens the link.
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

	test('the tab bar marks the section of a detail page', async ({ page }) => {
		await open(page, '/it/progetti/relay');
		const tabs = page.getByRole('navigation', { name: 'Sezioni' });
		await expect(tabs.getByRole('link', { name: 'Progetti' })).toHaveAttribute(
			'aria-current',
			'page'
		);
		await expect(tabs.getByRole('link', { name: 'Home' })).not.toHaveAttribute('aria-current');
	});

	test('Menu opens the index from below and closes it with Esc, Menu, the handle and a tap outside', async ({
		page
	}) => {
		await open(page, '/it/progetti/relay');
		const sidebar = page.locator('[data-sidebar]');
		const menu = page.getByRole('navigation', { name: 'Sezioni' }).getByRole('button', {
			name: 'Menu'
		});
		await expect(menu).toHaveAttribute('aria-expanded', 'false');

		await menu.click();
		await expect(sidebar).toBeVisible();
		await expect(menu).toHaveAttribute('aria-expanded', 'true');
		await expect(page.locator('[data-content]')).toHaveAttribute('inert', '');
		await page.keyboard.press('Escape');
		await expect(sidebar).toBeHidden();
		await expect(page).toHaveURL(/\/it\/progetti\/relay$/);

		await menu.click();
		await expect(sidebar).toBeVisible();
		await menu.click();
		await expect(sidebar).toBeHidden();

		await menu.click();
		await page.getByRole('button', { name: 'Chiudi' }).click();
		await expect(sidebar).toBeHidden();

		await menu.click();
		await page.mouse.click(200, 30);
		await expect(sidebar).toBeHidden();
		await expect(page.locator('[data-content]')).not.toHaveAttribute('inert', '');
	});

	test('dragging the handle down closes the menu, a vertical swipe in it scrolls the list', async ({
		page
	}) => {
		await open(page, '/it/progetti/relay');
		await page
			.getByRole('navigation', { name: 'Sezioni' })
			.getByRole('button', { name: 'Menu' })
			.click();
		const workspace = page.locator('[data-workspace]');
		await expect(workspace).toHaveAttribute('data-drawer', 'open');
		// Real touches via CDP: they generate touch pointer events, like a finger.
		const cdp = await page.context().newCDPSession(page);
		const touch = (type: 'touchStart' | 'touchMove' | 'touchEnd', x = 0, y = 0) =>
			cdp.send('Input.dispatchTouchEvent', {
				type,
				touchPoints: type === 'touchEnd' ? [] : [{ x, y }]
			});
		await touch('touchStart', 200, 600);
		for (let y = 580; y >= 300; y -= 20) await touch('touchMove', 202, y);
		await touch('touchEnd');
		await expect(workspace).toHaveAttribute('data-drawer', 'open');
		await expect
			.poll(() => page.locator('[data-sidebar-scroll]').evaluate((el) => el.scrollTop))
			.toBeGreaterThan(0);
		const handle = await page.locator('[data-drawer-grab]').boundingBox();
		const y0 = handle!.y + handle!.height / 2;
		await touch('touchStart', 200, y0);
		for (let y = y0 + 20; y <= y0 + 400; y += 20) await touch('touchMove', 200, y);
		await touch('touchEnd');
		await expect(workspace).not.toHaveAttribute('data-drawer');
	});

	test('the menu holds the search', async ({ page }) => {
		await open(page, '/it/metodo');
		await page
			.getByRole('navigation', { name: 'Sezioni' })
			.getByRole('button', { name: 'Menu' })
			.click();
		await page.locator('#search').fill('relay');
		await page.locator('[data-sidebar] a[href="/it/progetti/relay"]').click();
		await expect(page).toHaveURL(/\/it\/progetti\/relay$/);
	});

	test('a tap on a tab plays its icon gesture', async ({ page }) => {
		await open(page, '/it/progetti/relay');
		const home = page.getByRole('navigation', { name: 'Sezioni' }).getByRole('link', {
			name: 'Home'
		});
		await home.dispatchEvent('pointerdown');
		await expect(home).toHaveAttribute('data-play', '');
		expect(
			await home.locator('[data-motion="house"]').evaluate((n) => getComputedStyle(n).animationName)
		).toBe('icon-hop');
	});

	test('a section goes up to the home', async ({ page }) => {
		await open(page, '/it/metodo');
		await page.getByRole('link', { name: 'esse.dev', exact: true }).click();
		await expect(page).toHaveURL(/\/it$/);
	});
});
