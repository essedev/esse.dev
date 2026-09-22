/**
 * Favicon e icone del manifest, generati da un solo disegno: uno schermo scuro con la
 * cornice del telaio, una "e" in Martian Mono e un cursore a blocco in accento. È il
 * logo ridotto all'osso (esse bianco, dev in accento) dentro lo schermo del sito.
 *
 * Gli output stanno in static/ e sono committati: cambiano solo se cambia il disegno o
 * l'accento di default, e in quel caso si rilancia `pnpm generate-favicons`. Non è
 * nella catena di build apposta: un'icona non deve dipendere da un build che gira.
 */
import { Resvg } from '@resvg/resvg-js';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import satori from 'satori';

// L'accento di default (`--color-accent` in globals.css). La favicon non può seguire
// l'AccentPicker, che vive nel browser: prende il colore con cui il sito nasce.
const ACCENT = '#2cc3f7';
const BG = '#0c0c0c';
const STATIC = join(process.cwd(), 'static');
const FONT = readFileSync(
	join(
		process.cwd(),
		'node_modules/@fontsource/martian-mono/files/martian-mono-latin-600-normal.woff'
	)
);

/** Il disegno a 512px. `bleed` toglie gli angoli arrotondati: iOS e le maschere li rifanno da sé. */
async function draw(bleed: boolean): Promise<string> {
	return satori(
		{
			type: 'div',
			props: {
				style: {
					width: 512,
					height: 512,
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					background: BG,
					borderRadius: bleed ? 0 : 112,
					position: 'relative'
				},
				children: [
					{
						type: 'div',
						props: {
							style: {
								position: 'absolute',
								top: bleed ? 56 : 36,
								left: bleed ? 56 : 36,
								right: bleed ? 56 : 36,
								bottom: bleed ? 56 : 36,
								border: '10px solid rgba(255,255,255,0.14)',
								borderRadius: 80
							}
						}
					},
					{
						type: 'div',
						props: {
							style: { display: 'flex', alignItems: 'flex-end', marginTop: 8 },
							children: [
								{
									type: 'div',
									props: {
										style: {
											fontFamily: 'Martian Mono',
											fontWeight: 600,
											fontSize: 300,
											lineHeight: 1,
											color: '#f5f5f5'
										},
										children: 'e'
									}
								},
								{
									type: 'div',
									props: {
										style: {
											width: 64,
											height: 34,
											marginLeft: 18,
											marginBottom: 52,
											background: ACCENT,
											boxShadow: `0 0 36px ${ACCENT}`
										}
									}
								}
							]
						}
					}
				]
			}
		},
		{ width: 512, height: 512, fonts: [{ name: 'Martian Mono', data: FONT, weight: 600 }] }
	);
}

function png(svg: string, size: number): Buffer {
	return new Resvg(svg, { fitTo: { mode: 'width', value: size } }).render().asPng();
}

/** ICO minimale con PNG incorporati (formato valido da Windows Vista in poi). */
function ico(images: { size: number; data: Buffer }[]): Buffer {
	const header = Buffer.alloc(6);
	header.writeUInt16LE(0, 0);
	header.writeUInt16LE(1, 2);
	header.writeUInt16LE(images.length, 4);
	const entries: Buffer[] = [];
	let offset = 6 + 16 * images.length;
	for (const { size, data } of images) {
		const e = Buffer.alloc(16);
		e.writeUInt8(size >= 256 ? 0 : size, 0);
		e.writeUInt8(size >= 256 ? 0 : size, 1);
		e.writeUInt8(0, 2);
		e.writeUInt8(0, 3);
		e.writeUInt16LE(1, 4);
		e.writeUInt16LE(32, 6);
		e.writeUInt32LE(data.length, 8);
		e.writeUInt32LE(offset, 12);
		offset += data.length;
		entries.push(e);
	}
	return Buffer.concat([header, ...entries, ...images.map((i) => i.data)]);
}

const rounded = await draw(false);
const bleed = await draw(true);

writeFileSync(join(STATIC, 'favicon.svg'), rounded);
writeFileSync(join(STATIC, 'favicon-96x96.png'), png(rounded, 96));
writeFileSync(
	join(STATIC, 'favicon.ico'),
	ico([16, 32, 48].map((size) => ({ size, data: png(rounded, size) })))
);
writeFileSync(join(STATIC, 'apple-touch-icon.png'), png(bleed, 180));
writeFileSync(join(STATIC, 'web-app-manifest-192x192.png'), png(rounded, 192));
writeFileSync(join(STATIC, 'web-app-manifest-512x512.png'), png(rounded, 512));
writeFileSync(join(STATIC, 'web-app-manifest-maskable-512x512.png'), png(bleed, 512));

console.log('Favicon e icone del manifest generate in static/');
