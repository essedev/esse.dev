import { expect, test, type Locator } from '@playwright/test';

// Reduced motion (DECISIONS #25): what moves through space stops, the rest stays. The checks
// read the computed animation, which is what the browser actually runs.

const animation = (el: Locator) => el.evaluate((node) => getComputedStyle(node).animationName);
const pseudo = (el: Locator, which: '::before' | '::after') =>
	el.evaluate((node, w) => {
		const s = getComputedStyle(node, w);
		return { name: s.animationName, opacity: s.opacity, transform: s.transform };
	}, which);

test.describe('with reduced motion', () => {
	test.use({ reducedMotion: 'reduce' });

	test('an icon glows instead of moving, a stroke still draws itself', async ({ page }) => {
		await page.goto('/en');
		const home = page.locator('[data-sidebar] a:has([data-motion="house"])').first();
		await home.hover();
		await expect.poll(() => animation(home.locator('[data-motion="house"]'))).toBe('icon-glow');

		const now = page.locator('[data-sidebar] a:has([data-motion="activity"])').first();
		await now.hover();
		await expect
			.poll(() => animation(now.locator('[data-motion="activity"] > *').first()))
			.toBe('icon-snake');
	});

	test('what has no displacement keeps running', async ({ page }) => {
		await page.goto('/en');
		await expect.poll(() => animation(page.locator('.caret').first())).toBe('caret-blink');
		await expect
			.poll(() => animation(page.locator('.led[data-status="in-progress"]').first()))
			.toBe('led-breathe');
	});

	test('the drawer fades in place instead of sliding', async ({ page }) => {
		await page.setViewportSize({ width: 390, height: 844 });
		await page.goto('/en');
		const panel = page.locator('[data-drawer-panel]');
		const style = () =>
			panel.evaluate((node) => {
				const s = getComputedStyle(node);
				return { translate: s.translate, opacity: s.opacity };
			});
		expect(await style()).toEqual({ translate: '0px', opacity: '0' });
		await page.locator('[data-drawer-open]').first().click();
		await expect(page.locator('[data-workspace]')).toHaveAttribute('data-drawer', 'open');
		await expect.poll(style).toEqual({ translate: '0px', opacity: '1' });
	});

	test('the error number keeps its fringe, still', async ({ page }) => {
		await page.goto('/en/projects/does-not-exist-xyz');
		const signal = page.locator('.signal');
		expect(await animation(signal)).toBe('none');
		const red = await pseudo(signal, '::before');
		expect(red.name).toBe('none');
		expect(red.opacity).toBe('0.5');
		expect(red.transform).not.toBe('none');
	});
});

test.describe('without reduced motion', () => {
	test.use({ reducedMotion: 'no-preference' });

	test('an icon makes its gesture and the error number is disturbed', async ({ page }) => {
		await page.goto('/en');
		const home = page.locator('[data-sidebar] a:has([data-motion="house"])').first();
		await home.hover();
		await expect.poll(() => animation(home.locator('[data-motion="house"]'))).toBe('icon-hop');

		await page.goto('/en/projects/does-not-exist-xyz');
		expect(await animation(page.locator('.signal'))).toBe('signal-jump');
	});
});
