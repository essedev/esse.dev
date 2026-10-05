/**
 * Writes a designed project logo, for projects without one of their own: a rounded tile
 * tinted with the project's accent and one Lucide glyph in the accent, as an SVG with no
 * margin around the tile. Every designed logo comes from here, so they share one geometry.
 *
 * Usage: node --experimental-strip-types scripts/render-logo.ts <lucide-name> <#accent> <out.svg>
 * Example: node --experimental-strip-types scripts/render-logo.ts plug '#7dd3fc' src/content/projects/mcpbelt/logo.svg
 */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const [name, accent, out] = process.argv.slice(2);
if (!name || !/^#[0-9a-f]{6}$/i.test(accent ?? '') || !out) {
	console.error('usage: render-logo.ts <lucide-name> <#rrggbb> <out.svg>');
	process.exit(1);
}

// The icon data of @lucide/astro, the same set the site uses: one file per icon.
// The package exports no package.json, so the folder is reached from the project root.
const icons = join(process.cwd(), 'node_modules/@lucide/astro/src/icons');
if (!readdirSync(icons).includes(`${name}.ts`)) {
	console.error(`no Lucide icon named "${name}" (see https://lucide.dev/icons)`);
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
const glyph = nodes.map(([tag, a]) => `<${tag} ${attrs(a)}/>`).join('');

// Tile 128, glyph 64 centered (scale 64/24 from Lucide's 24 grid), stroke 2 in icon units.
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
	<defs>
		<linearGradient id="t" x1="0" y1="0" x2="1" y2="1">
			<stop offset="0" stop-color="${accent}" stop-opacity="0.24"/>
			<stop offset="1" stop-color="${accent}" stop-opacity="0.08"/>
		</linearGradient>
	</defs>
	<rect width="128" height="128" rx="28" fill="#121019"/>
	<rect width="128" height="128" rx="28" fill="url(#t)"/>
	<g transform="translate(32 32) scale(${64 / 24})" fill="none" stroke="${accent}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${glyph}</g>
</svg>
`;
writeFileSync(out, svg);
console.log(`${out} (${name}, ${accent})`);
