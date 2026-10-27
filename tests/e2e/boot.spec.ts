import { expect, test, type Page } from '@playwright/test';

// The boot (DECISIONS #37). Automated browsers skip it (`navigator.webdriver`), which keeps
// every other test on the plain page: here the page is told it is not automated, and the
// storage is set as a returning visitor would have it. Navigations wait only for the DOM: with
// several browsers at work `load` can arrive after the boot has ended.

interface Boot {
	ids: string[];
	news: { id: string; title: string }[];
}

/** From the next navigation on, the page sees a person, not an automated browser. */
const asPerson = (page: Page) =>
	page.addInitScript(() => Object.defineProperty(navigator, 'webdriver', { get: () => false }));

const visit = (page: Page, path: string) => page.goto(path, { waitUntil: 'domcontentloaded' });
const again = (page: Page) => page.reload({ waitUntil: 'domcontentloaded' });

/** The boot data of a page, read without the boot running. */
const bootData = async (page: Page, path: string): Promise<Boot> => {
	await page.goto(path);
	const raw = await page.locator('[data-boot-screen]').getAttribute('data-boot-data');
	return JSON.parse(raw!) as Boot;
};

/** A visitor seen before: the storage of their last boot. */
const seen = (page: Page, ids: string[], daysAgo: number) =>
	page.evaluate(([seen, at]) => localStorage.setItem('boot', JSON.stringify({ seen, at })), [
		ids,
		Date.now() - daysAgo * 24 * 60 * 60 * 1000
	] as const);

const html = (page: Page) => page.locator('html');
const log = (page: Page) => page.locator('[data-boot-log]');

test('an automated browser sees the page without the boot', async ({ page }) => {
	await page.goto('/en');
	await expect(html(page)).not.toHaveAttribute('data-boot');
	await expect(page.locator('[data-boot-screen]')).toBeHidden();
});

test('the first visit boots in full, then the window opens and the visit is recorded', async ({
	page
}) => {
	await asPerson(page);
	await visit(page, '/en');
	await expect(html(page)).toHaveAttribute('data-boot', 'full');
	await expect(page.locator('[data-boot-screen]')).toBeVisible();
	await expect(log(page)).toContainText('Memory test: projects');
	await expect(log(page)).toContainText('Reached workspace.target');
	await expect(log(page)).toContainText('esse.dev login: guest');
	await expect(html(page)).not.toHaveAttribute('data-boot', { timeout: 20_000 });
	await expect(page.locator('[data-boot-screen]')).toBeHidden();

	const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('boot')!));
	const releases = await page.locator('script[data-releases]').getAttribute('data-releases');
	expect(stored.seen).toEqual(releases!.split(' '));

	await again(page);
	await expect(html(page)).not.toHaveAttribute('data-boot');
});

test('a key skips the boot and does nothing else', async ({ page }) => {
	await asPerson(page);
	await visit(page, '/en');
	await expect(log(page)).toContainText('BIOS');
	await page.keyboard.press('/');
	await expect(html(page)).not.toHaveAttribute('data-boot');
	await expect(page.locator('[data-boot-screen]')).toBeHidden();
	await expect(page.locator('#search')).not.toBeFocused();
});

test('a new release since the last visit gets the short boot, with what changed', async ({
	page
}) => {
	const { ids, news } = await bootData(page, '/en');
	await seen(
		page,
		ids.filter((id) => id !== news[0].id),
		1
	);
	await asPerson(page);
	await again(page);
	await expect(html(page)).toHaveAttribute('data-boot', 'short');
	await expect(log(page)).toContainText('Quick boot: 1 new since the last boot');
	await expect(log(page)).toContainText(`New: ${news[0].title}`);
	await expect(log(page)).not.toContainText('Memory test');
	await expect(html(page)).not.toHaveAttribute('data-boot', { timeout: 20_000 });
});

test('a week after the last visit, with nothing new, the short boot says so', async ({ page }) => {
	const { ids } = await bootData(page, '/en');
	await seen(page, ids, 8);
	await asPerson(page);
	await again(page);
	await expect(html(page)).toHaveAttribute('data-boot', 'short');
	await expect(log(page)).toContainText('Quick boot: nothing new since the last boot');
});

test('a visit within the week, with nothing new, has no boot', async ({ page }) => {
	const { ids } = await bootData(page, '/en');
	await seen(page, ids, 3);
	await asPerson(page);
	await again(page);
	await expect(html(page)).not.toHaveAttribute('data-boot');
});

test('without storage there is no boot, or it would run on every page', async ({ page }) => {
	await page.addInitScript(() => {
		Object.defineProperty(navigator, 'webdriver', { get: () => false });
		Storage.prototype.setItem = () => {
			throw new DOMException('blocked', 'SecurityError');
		};
	});
	await page.goto('/en');
	await expect(html(page)).not.toHaveAttribute('data-boot');
});

test('after the login the interface is a skeleton whose pieces load one by one', async ({
	page
}) => {
	await asPerson(page);
	await visit(page, '/en');
	// Read in the frame the skeleton shows: the screen is off, every piece on screen waits.
	const skeleton = await page.waitForFunction(
		() => {
			if (document.documentElement.dataset.boot !== 'load') return false;
			const headline = document.querySelector('main h1 + p, main h1 ~ *');
			return {
				waiting: document.querySelectorAll('[data-skel]').length,
				screen: getComputedStyle(document.querySelector('[data-boot-screen]')!).display,
				ink: headline ? getComputedStyle(headline).color : null
			};
		},
		null,
		{ timeout: 20_000, polling: 'raf' }
	);
	const frame = (await skeleton.jsonValue()) as { waiting: number; screen: string; ink: string };
	expect(frame.waiting).toBeGreaterThan(20);
	expect(frame.screen).toBe('none');
	expect(frame.ink).toBe('rgba(0, 0, 0, 0)');

	await expect(html(page)).not.toHaveAttribute('data-boot', { timeout: 20_000 });
	await expect(page.locator('[data-skel]')).toHaveCount(0);
});

test('a skip during the loading shows the whole interface at once', async ({ page }) => {
	await asPerson(page);
	await visit(page, '/en');
	await page.waitForFunction(() => document.documentElement.dataset.boot === 'load', null, {
		timeout: 20_000,
		polling: 'raf'
	});
	await page.keyboard.press('Escape');
	await expect(html(page)).not.toHaveAttribute('data-boot');
	await expect(page.locator('[data-skel]')).toHaveCount(0);
});
