/**
 * Captures the screenshots the web app manifest offers to the install dialogs (DECISIONS #47):
 * the home of each language, on a phone and on a desktop, in the dark theme. Run by hand with
 * `pnpm pwa-screenshots` when the home changes visibly; the files are committed in
 * `public/pwa/`. It builds the site without them (the manifest would ask for them), serves it
 * with wrangler on its own port and stops it at the end.
 */
import { chromium } from '@playwright/test';
import { execSync, spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import sharp from 'sharp';
import languages from '../src/config/languages.json' with { type: 'json' };
import { SCREENSHOTS, screenshotPath } from '../src/lib/pwa.ts';

const PORT = 8789;
const origin = `http://localhost:${PORT}`;

/** Waits until the Worker answers, as Playwright's webServer does. */
async function ready(url: string, timeout = 120_000) {
	const end = Date.now() + timeout;
	while (Date.now() < end) {
		try {
			if ((await fetch(url)).ok) return;
		} catch {
			// Not listening yet.
		}
		await new Promise((resolve) => setTimeout(resolve, 500));
	}
	throw new Error(`pwa-screenshots: ${url} did not answer in ${timeout / 1000} s`);
}

execSync('pnpm build', { stdio: 'inherit', env: { ...process.env, PWA_SCREENSHOTS: 'capture' } });
// Its own process group, so wrangler and workerd stop together.
const server = spawn('pnpm', ['exec', 'wrangler', 'dev', '--port', String(PORT)], {
	stdio: 'ignore',
	detached: true
});

try {
	await ready(`${origin}/en`);
	mkdirSync('public/pwa', { recursive: true });
	const browser = await chromium.launch();
	for (const { code: lang } of languages) {
		for (const shot of SCREENSHOTS) {
			const phone = shot.form === 'narrow';
			const context = await browser.newContext({
				viewport: shot.viewport,
				deviceScaleFactor: shot.scale,
				isMobile: phone,
				hasTouch: phone,
				colorScheme: 'dark',
				serviceWorkers: 'block'
			});
			const page = await context.newPage();
			await page.goto(`${origin}/${lang}`, { waitUntil: 'networkidle' });
			await page.evaluate(() => document.fonts.ready);
			// The cursor and the arrival of the logos settle.
			await page.waitForTimeout(1000);
			const file = `public${screenshotPath(lang, shot)}`;
			await sharp(await page.screenshot())
				.webp({ quality: 82 })
				.toFile(file);
			console.log(file);
			await context.close();
		}
	}
	await browser.close();
} finally {
	process.kill(-server.pid!);
}
