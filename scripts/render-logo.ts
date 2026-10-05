/**
 * Writes a project logo as a tile: a rounded square tinted with the project's accent and,
 * centered on it, either one Lucide glyph in the accent (for projects without a mark of their
 * own) or the project's own mark (a transparent image, so it sits on the same tile as the
 * others). An SVG with no margin around the tile: every logo on the site that has no tile of
 * its own comes from here, so they share one geometry.
 *
 * Usage: node --experimental-strip-types scripts/render-logo.ts <lucide-name | mark-file> <#accent> <out.svg>
 * Examples:
 *   node --experimental-strip-types scripts/render-logo.ts plug '#7dd3fc' src/content/projects/mcpbelt/logo.svg
 *   node --experimental-strip-types scripts/render-logo.ts mark.png '#fb7185' src/content/projects/zeno/logo.svg
 */
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { extname, join } from 'node:path';

const [symbol, accent, out] = process.argv.slice(2);
if (!symbol || !/^#[0-9a-f]{6}$/i.test(accent ?? '') || !out) {
	console.error('usage: render-logo.ts <lucide-name | mark-file> <#rrggbb> <out.svg>');
	process.exit(1);
}

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
function glyph(name: string): string {
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
	return `<g transform="translate(32 32) scale(${64 / 24})" fill="none" stroke="${accent}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths}</g>`;
}

const content = existsSync(symbol) ? mark(symbol) : glyph(symbol);
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
	<defs>
		<linearGradient id="t" x1="0" y1="0" x2="1" y2="1">
			<stop offset="0" stop-color="${accent}" stop-opacity="0.24"/>
			<stop offset="1" stop-color="${accent}" stop-opacity="0.08"/>
		</linearGradient>
	</defs>
	<rect width="128" height="128" rx="28" fill="#121019"/>
	<rect width="128" height="128" rx="28" fill="url(#t)"/>
	${content}
</svg>
`;
writeFileSync(out, svg);
console.log(`${out} (${existsSync(symbol) ? 'mark' : 'glyph'} ${symbol}, ${accent})`);
