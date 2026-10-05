/**
 * Renders a designed project cover (a mockup, for projects with no interface to show) from a
 * JSON spec, in the site's style: dark ground with the accent's glow, the title in Geist, a
 * prompt line and a panel in Departure Mono. No logo: the project page lays its own over the
 * cover's edge, so a logo here would show twice. Output is a 2100x900 WebP
 * (21:9, the cover's crop on desktop).
 *
 * Usage: node --experimental-strip-types scripts/render-cover.ts <spec.json> [...]
 *
 * Spec, paths relative to the spec file:
 *   { "title": "pgbee", "tagline": "AI-derived columns for PostgreSQL",
 *     "accent": "#ffd166", "prompt": "select summary from tickets",
 *     "panel": { "kind": "code" | "list", "lines": ["..."] } | { "kind": "image", "image": "x.png" },
 *     "out": "cover.webp" }
 *
 * The spec lives next to the cover (`cover.json`) so the cover can be regenerated when a text
 * changes; it is not read by the site.
 */
import { readFileSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, extname, resolve } from 'node:path';
import { chromium } from '@playwright/test';
import sharp from 'sharp';

interface Spec {
	title: string;
	tagline: string;
	accent?: string;
	prompt?: string;
	panel?: { kind: 'code' | 'list'; lines: string[] } | { kind: 'image'; image: string };
	out: string;
}

const require = createRequire(import.meta.url);
const MIME: Record<string, string> = {
	'.svg': 'image/svg+xml',
	'.png': 'image/png',
	'.webp': 'image/webp',
	'.jpg': 'image/jpeg',
	'.jpeg': 'image/jpeg',
	'.woff': 'font/woff'
};

/** A file as a data URL, so the page needs no server and no file access. */
function dataUrl(path: string): string {
	return `data:${MIME[extname(path).toLowerCase()] ?? 'application/octet-stream'};base64,${readFileSync(path).toString('base64')}`;
}

const escapeHtml = (s: string) =>
	s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function page(spec: Spec, base: string): string {
	const accent = spec.accent ?? '#b59cff';
	const geist = (w: number) =>
		dataUrl(require.resolve(`@fontsource/geist-sans/files/geist-sans-latin-${w}-normal.woff`));
	const mono = dataUrl(resolve('src/assets/fonts/DepartureMono-Regular.woff'));
	let panel = '';
	if (spec.panel?.kind === 'image') {
		panel = `<div class="panel shot"><img src="${dataUrl(resolve(base, spec.panel.image))}" alt=""></div>`;
	} else if (spec.panel) {
		const lines = spec.panel.lines
			.map((l) => `<div class="line ${spec.panel!.kind}">${escapeHtml(l)}</div>`)
			.join('');
		panel = `<div class="panel">${lines}</div>`;
	}
	return `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face { font-family: Geist; font-weight: 400; src: url(${geist(400)}) format('woff'); }
@font-face { font-family: Geist; font-weight: 500; src: url(${geist(500)}) format('woff'); }
@font-face { font-family: Mono; src: url(${mono}) format('woff'); }
* { box-sizing: border-box; margin: 0; }
body {
	width: 2100px; height: 900px; overflow: hidden; display: grid;
	grid-template-columns: ${panel ? '1fr 820px' : '1fr'}; align-items: center; gap: 120px;
	padding: 0 150px; color: #efedf5; font-family: Geist, sans-serif;
	background:
		radial-gradient(55% 80% at 88% 10%, color-mix(in srgb, ${accent} 20%, transparent), transparent),
		radial-gradient(40% 60% at 0% 100%, color-mix(in srgb, #6e50ff 12%, transparent), transparent),
		#0b0a10;
}
body::after { /* the CRT scanlines of the site, faint */
	content: ''; position: fixed; inset: 0; pointer-events: none;
	background: repeating-linear-gradient(transparent 0 3px, rgb(255 255 255 / 0.018) 3px 4px);
}
h1 { font-size: 112px; font-weight: 500; letter-spacing: -0.03em; line-height: 1; }
.tagline { margin-top: 28px; font-size: 40px; line-height: 1.35; color: #cbc9d4; max-width: 900px; }
.prompt { margin-top: 48px; font-family: Mono; font-size: 26px; color: #9c9aa8; }
.prompt b { color: ${accent}; font-weight: 400; }
.panel {
	border-radius: 22px; padding: 44px 48px; font-family: Mono; font-size: 25px; line-height: 1.75;
	background: rgb(255 255 255 / 0.035); box-shadow: inset 0 0 0 1px rgb(255 255 255 / 0.07), 0 30px 80px rgb(0 0 0 / 0.45);
	color: #cbc9d4; white-space: pre; overflow: hidden;
}
.panel.shot { padding: 0; } .panel.shot img { display: block; width: 100%; }
.line.list::before { content: '› '; color: ${accent}; }
.line.code:first-child { color: ${accent}; }
</style></head><body>
<div><h1>${escapeHtml(spec.title)}</h1><p class="tagline">${escapeHtml(spec.tagline)}</p>
${spec.prompt ? `<p class="prompt"><b>$</b> ${escapeHtml(spec.prompt)}</p>` : ''}</div>
${panel}
</body></html>`;
}

const specs = process.argv.slice(2);
if (!specs.length) {
	console.error('usage: render-cover.ts <spec.json> [...]');
	process.exit(1);
}
const browser = await chromium.launch();
const tab = await browser.newPage({ viewport: { width: 2100, height: 900 } });
for (const file of specs) {
	const spec = JSON.parse(readFileSync(file, 'utf8')) as Spec;
	const base = dirname(resolve(file));
	await tab.setContent(page(spec, base));
	await tab.evaluate(() => document.fonts.ready);
	const out = resolve(base, spec.out);
	await sharp(await tab.screenshot({ type: 'png' }))
		.webp({ quality: 86 })
		.toFile(out);
	console.log(`${out} ${Math.round(statSync(out).size / 1024)} KB`);
}
await browser.close();
