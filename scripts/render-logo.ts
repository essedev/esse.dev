/**
 * Writes a project logo as a tile: a rounded square tinted with the project's accent and,
 * centered on it, either one Lucide glyph in the accent (for projects without a mark of their
 * own) or the project's own mark (a transparent image, so it sits on the same tile as the
 * others). An SVG with no margin around the tile: every logo on the site that has no tile of
 * its own comes from here, so they share one geometry. Every logo comes in two, one per
 * theme: `<out>.svg` on the dark tile and `<out>-light.svg` on a light tile tinted with the
 * accent, the glyph in the accent darkened for the light (light-accent.ts); a mark stays as it is.
 *
 * Usage: node --experimental-strip-types scripts/render-logo.ts <lucide-name | mark-file> <#accent> <out.svg> [--tile=#rrggbb]
 *        node --experimental-strip-types scripts/render-logo.ts --light <logo.svg> [...]
 * `--tile` sets the dark tile's base colour (default the site's dark #121019): a light one for
 * a mark drawn with dark outlines, which would sink into the dark tile. `--light` writes the
 * light variant of logos already made here, read back from their SVG.
 * Examples:
 *   node --experimental-strip-types scripts/render-logo.ts plug '#7dd3fc' src/content/projects/mcpbelt/logo.svg
 *   node --experimental-strip-types scripts/render-logo.ts mark.png '#fb7185' src/content/projects/zeno/logo.svg
 */
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { basename, dirname, extname, join } from 'node:path';
import { lightAccent } from './light-accent.ts';

type Theme = 'dark' | 'light';

const DARK_TILE = '#121019';
/** The light tile: a step lighter than the light theme's lilac glass. */
const LIGHT_TILE = '#f4f1fa';

const MIME: Record<string, string> = {
	'.svg': 'image/svg+xml',
	'.png': 'image/png',
	'.webp': 'image/webp'
};

/** The project's own mark, embedded: 90 of 128, the share Portsage's book has on its tile. */
function mark(path: string): string {
	const type = MIME[extname(path).toLowerCase()];
	if (!type) throw new Error(`a mark must be svg, png or webp: ${path}`);
	const href = `data:${type};base64,${readFileSync(path).toString('base64')}`;
	return `<image x="19" y="19" width="90" height="90" preserveAspectRatio="xMidYMid meet" href="${href}"/>`;
}

/** A Lucide glyph, 64 of 128 (scale 64/24 from Lucide's 24 grid), stroke 2 in icon units. */
function glyph(name: string, color: string): string {
	// The icon data of @lucide/astro, the same set the site uses: one file per icon.
	// The package exports no package.json, so the folder is reached from the project root.
	const icons = join(process.cwd(), 'node_modules/@lucide/astro/src/icons');
	if (!readdirSync(icons).includes(`${name}.ts`)) {
		console.error(`no Lucide icon named "${name}" and no such file (see https://lucide.dev/icons)`);
		process.exit(1);
	}
	const source = readFileSync(join(icons, `${name}.ts`), 'utf8');
	const match = source.match(/"node":(\[.*?\])\}/s);
	if (!match) throw new Error(`cannot read the icon data of ${name}`);
	const nodes = JSON.parse(match[1]) as [string, Record<string, string>][];
	const attrs = (a: Record<string, string>) =>
		Object.entries(a)
			.filter(([k]) => k !== 'key')
			.map(([k, v]) => `${k}="${v}"`)
			.join(' ');
	const paths = nodes.map(([tag, a]) => `<${tag} ${attrs(a)}/>`).join('');
	return `<g transform="translate(32 32) scale(${64 / 24})" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths}</g>`;
}

/** The tile around a glyph or mark, in one theme. The light one is tinted with the bright
 * accent, stronger than the dark one, and draws a hairline: a paper tile melted into the
 * paper page. The glyph on it takes the darkened accent. */
function tileSvg(content: string, accent: string, tile: string, theme: Theme): string {
	const [from, to] = theme === 'light' ? [0.34, 0.16] : [0.24, 0.08];
	const hairline =
		theme === 'light'
			? '\n\t<rect x="0.5" y="0.5" width="127" height="127" rx="27.5" fill="none" stroke="#2e1c6e" stroke-opacity="0.12"/>'
			: '';
	return `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
	<defs>
		<linearGradient id="t" x1="0" y1="0" x2="1" y2="1">
			<stop offset="0" stop-color="${accent}" stop-opacity="${from}"/>
			<stop offset="1" stop-color="${accent}" stop-opacity="${to}"/>
		</linearGradient>
	</defs>
	<rect width="128" height="128" rx="28" fill="${tile}"/>
	<rect width="128" height="128" rx="28" fill="url(#t)"/>${hairline}
	${content}
</svg>
`;
}

/** The path of the light variant: `logo.svg` gives `logo-light.svg`. */
function lightPath(out: string): string {
	const ext = extname(out);
	return join(dirname(out), `${basename(out, ext)}-light${ext}`);
}

/** The light variant of a logo made here, read back from its SVG: accent, and glyph or mark. */
function lightFrom(file: string) {
	const svg = readFileSync(file, 'utf8');
	const accent = svg.match(/stop-color="(#[0-9a-f]{6})"/i)?.[1];
	const content = svg.match(/fill="url\(#t\)"\/>\s*([\s\S]*?)\s*<\/svg>/)?.[1];
	if (!accent || !content || content.includes('stroke-opacity="0.12"')) {
		console.error(`${file}: not a dark logo made by render-logo.ts`);
		process.exit(1);
	}
	const ink = lightAccent(accent);
	const light = content.replaceAll(`stroke="${accent}"`, `stroke="${ink}"`);
	writeFileSync(lightPath(file), tileSvg(light, accent, LIGHT_TILE, 'light'));
	console.log(`${lightPath(file)} (light of ${file}, ${ink})`);
}

const args = process.argv.slice(2);
const files = args.filter((a) => !a.startsWith('--'));
if (args.includes('--light')) {
	if (!files.length) {
		console.error('usage: render-logo.ts --light <logo.svg> [...]');
		process.exit(1);
	}
	files.forEach(lightFrom);
} else {
	const [symbol, accent, out] = files;
	const tile = args.find((a) => a.startsWith('--tile='))?.slice(7) ?? DARK_TILE;
	const hex = /^#[0-9a-f]{6}$/i;
	if (!symbol || !hex.test(accent ?? '') || !out || !hex.test(tile)) {
		console.error(
			'usage: render-logo.ts <lucide-name | mark-file> <#rrggbb> <out.svg> [--tile=#rrggbb]'
		);
		process.exit(1);
	}
	const isMark = existsSync(symbol);
	const ink = lightAccent(accent);
	writeFileSync(out, tileSvg(isMark ? mark(symbol) : glyph(symbol, accent), accent, tile, 'dark'));
	writeFileSync(
		lightPath(out),
		tileSvg(isMark ? mark(symbol) : glyph(symbol, ink), accent, LIGHT_TILE, 'light')
	);
	console.log(`${out} and ${lightPath(out)} (${isMark ? 'mark' : 'glyph'} ${symbol}, ${accent})`);
}
