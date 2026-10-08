/**
 * Renders a designed project cover, for projects with no interface to show, from a JSON spec:
 * one panel (code, a list or a small screenshot) centered on the site's dark ground with the
 * accent's glow. No text besides the panel's: the page names and describes the project right
 * below the cover, in the visitor's language, and lays its logo over the cover's edge.
 * Output is a 2100x900 WebP (21:9, the desktop crop); the panel stays inside the central
 * 16:9 crop used on mobile. Every spec gives two covers, one per theme: `out` on the dark
 * ground and `<out>-light` on the site's paper, with the accent darkened (light-accent.ts).
 *
 * Usage: node --experimental-strip-types scripts/render-cover.ts <spec.json> [...]
 *
 * Spec, paths relative to the spec file:
 *   { "accent": "#ffd166", "prompt": "play the next episode",
 *     "panel": { "kind": "code" | "list", "lines": ["..."] } | { "kind": "image", "image": "x.png" },
 *     "out": "cover.webp" }
 * `prompt` is an optional first line of a code or list panel, after a `$` in the accent.
 *
 * The spec lives next to the cover (`cover.json`) so the cover can be regenerated; it is not
 * read by the site.
 */
import { readFileSync, statSync } from 'node:fs';
import { basename, dirname, extname, join, resolve } from 'node:path';
import { chromium } from '@playwright/test';
import sharp from 'sharp';
import { lightAccent } from './light-accent.ts';

interface Spec {
	accent?: string;
	prompt?: string;
	panel: { kind: 'code' | 'list'; lines: string[] } | { kind: 'image'; image: string };
	out: string;
}

type Theme = 'dark' | 'light';

/** The ground, panel and text of each theme: the site's tokens (global.css), by hand. */
const THEME = {
	dark: {
		ground: '#0b0a10',
		glow: 'color-mix(in srgb, #6e50ff 12%, transparent)',
		accentGlow: 20,
		scan: 'rgb(255 255 255 / 0.018)',
		panel: 'rgb(255 255 255 / 0.035)',
		edge: 'rgb(255 255 255 / 0.07)',
		shadow: 'rgb(0 0 0 / 0.45)',
		text: '#cbc9d4',
		muted: '#9c9aa8'
	},
	// The light ground is a mid lavender, the wallpaper's tone, not the paper: on a paper
	// ground the cover melted into the pane (1.01:1).
	light: {
		ground: '#d8d0ec',
		glow: 'color-mix(in srgb, #9d85ff 16%, transparent)',
		accentGlow: 16,
		scan: 'rgb(46 28 110 / 0.025)',
		panel: 'rgb(255 255 255 / 0.82)',
		edge: 'rgb(46 28 110 / 0.08)',
		shadow: 'rgb(60 40 130 / 0.18)',
		text: '#34303f',
		muted: '#57536a'
	}
} as const;

/** The largest box a screenshot fits in: inside the mobile crop, with room for the glow. */
const BOX = { width: 1500, height: 760 };

const MIME: Record<string, string> = {
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

async function page(spec: Spec, base: string, theme: Theme): Promise<string> {
	const t = THEME[theme];
	const accent =
		theme === 'light' ? lightAccent(spec.accent ?? '#b59cff') : (spec.accent ?? '#b59cff');
	const mono = dataUrl(resolve('src/assets/fonts/DepartureMono-Regular.woff'));
	let panel: string;
	if (spec.panel.kind === 'image') {
		const file = resolve(base, spec.panel.image);
		// Scaled to fill the box: a small screenshot grows a little rather than sit tiny.
		const { width = 1, height = 1 } = await sharp(file).metadata();
		const scale = Math.min(BOX.width / width, BOX.height / height);
		panel = `<div class="panel shot"><img src="${dataUrl(file)}" width="${Math.round(width * scale)}" height="${Math.round(height * scale)}" alt=""></div>`;
	} else {
		const kind = spec.panel.kind;
		const prompt = spec.prompt
			? `<div class="prompt"><b>$</b> ${escapeHtml(spec.prompt)}</div>`
			: '';
		const lines = spec.panel.lines
			.map((l) => `<div class="line ${kind}">${escapeHtml(l)}</div>`)
			.join('');
		panel = `<div class="panel">${prompt}${lines}</div>`;
	}
	return `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face { font-family: Mono; src: url(${mono}) format('woff'); }
* { box-sizing: border-box; margin: 0; }
body {
	width: 2100px; height: 900px; overflow: hidden; display: grid; place-items: center;
	background:
		radial-gradient(55% 80% at 88% 10%, color-mix(in srgb, ${accent} ${t.accentGlow}%, transparent), transparent),
		radial-gradient(40% 60% at 0% 100%, ${t.glow}, transparent),
		${t.ground};
}
body::after { /* the CRT scanlines of the site, faint */
	content: ''; position: fixed; inset: 0; pointer-events: none;
	background: repeating-linear-gradient(transparent 0 3px, ${t.scan} 3px 4px);
}
.panel {
	border-radius: 22px; padding: 64px 76px; font-family: Mono; font-size: 42px; line-height: 1.75;
	background: ${t.panel}; box-shadow: inset 0 0 0 1px ${t.edge}, 0 30px 80px ${t.shadow};
	color: ${t.text}; white-space: pre; overflow: hidden; max-width: ${BOX.width}px;
}
.panel.shot { padding: 0; } .panel.shot img { display: block; }
.prompt { color: ${t.muted}; margin-bottom: 20px; } .prompt b { color: ${accent}; font-weight: 400; }
.line.list::before { content: '› '; color: ${accent}; }
.line.code:first-child { color: ${accent}; }
</style></head><body>${panel}</body></html>`;
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
	const dark = resolve(base, spec.out);
	const ext = extname(dark);
	const outs: Record<Theme, string> = {
		dark,
		light: join(dirname(dark), `${basename(dark, ext)}-light${ext}`)
	};
	for (const theme of ['dark', 'light'] as const) {
		await tab.setContent(await page(spec, base, theme));
		await tab.evaluate(() => document.fonts.ready);
		await sharp(await tab.screenshot({ type: 'png' }))
			.webp({ quality: 86 })
			.toFile(outs[theme]);
		console.log(`${outs[theme]} ${Math.round(statSync(outs[theme]).size / 1024)} KB`);
	}
}
await browser.close();
