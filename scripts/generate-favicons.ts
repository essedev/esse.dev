/**
 * Favicons from the logo's blinking caret (concept D, proposal 7): a lavender rectangle
 * with a glow on a dark background. Run by hand with `pnpm favicons` when the mark or the
 * palette changes; the generated files are committed in `public/`.
 *
 * Two versions of the same drawing: the rounded tile for browser tabs, and the full-bleed
 * one for iOS and the manifest (iOS rounds the corners itself, and "maskable" icons want the
 * background to the edge, with the mark inside the central 80%).
 */
import { Resvg } from '@resvg/resvg-js';
import { writeFileSync } from 'node:fs';

// The colors of `@theme` in `src/styles/global.css`.
const BG = '#0a0a0d';
const ACCENT = '#b59cff';

// The same block as the logo's caret (`.caret` in global.css): 1 to 2 proportions, sharp
// corners like the pixels of Departure Mono, soft glow. 8x16 on the 32 grid becomes exactly
// 4x8 pixels in the 16 favicon, with no blurred edges.
const glow = `<filter id="glow" x="-1" y="-1" width="3" height="3"><feGaussianBlur stdDeviation="1.6"/></filter>`;
const caret = `<rect x="12" y="8" width="8" height="16" fill="${ACCENT}" fill-opacity=".7" filter="url(#glow)"/><rect x="12" y="8" width="8" height="16" fill="${ACCENT}"/>`;

const tile = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><defs>${glow}</defs><rect width="32" height="32" rx="7" fill="${BG}"/><rect x=".5" y=".5" width="31" height="31" rx="6.5" fill="none" stroke="#ffffff" stroke-opacity=".1"/>${caret}</svg>\n`;
const full = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><defs>${glow}</defs><rect width="32" height="32" fill="${BG}"/>${caret}</svg>\n`;

const png = (svg: string, size: number): Buffer =>
	Buffer.from(new Resvg(svg, { fitTo: { mode: 'width', value: size } }).render().asPng());

/** An ICO holding PNGs (allowed from Windows Vista on): header, index, images. */
function ico(images: { size: number; data: Buffer }[]): Buffer {
	const header = Buffer.alloc(6);
	header.writeUInt16LE(0, 0);
	header.writeUInt16LE(1, 2);
	header.writeUInt16LE(images.length, 4);
	let offset = 6 + 16 * images.length;
	const entries = images.map(({ size, data }) => {
		const entry = Buffer.alloc(16);
		entry.writeUInt8(size >= 256 ? 0 : size, 0);
		entry.writeUInt8(size >= 256 ? 0 : size, 1);
		entry.writeUInt16LE(1, 4);
		entry.writeUInt16LE(32, 6);
		entry.writeUInt32LE(data.length, 8);
		entry.writeUInt32LE(offset, 12);
		offset += data.length;
		return entry;
	});
	return Buffer.concat([header, ...entries, ...images.map((i) => i.data)]);
}

const out = (name: string, data: string | Buffer) => writeFileSync(`public/${name}`, data);

out('favicon.svg', tile);
out('favicon-96x96.png', png(tile, 96));
out('favicon.ico', ico([16, 32, 48].map((size) => ({ size, data: png(tile, size) }))));
out('apple-touch-icon.png', png(full, 180));
out('web-app-manifest-192x192.png', png(full, 192));
out('web-app-manifest-512x512.png', png(full, 512));
console.log('favicon generate in public/');
