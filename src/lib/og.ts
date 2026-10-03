/**
 * Layout delle immagini Open Graph (1200x630) come albero di elementi per satori. Puro:
 * il rendering a PNG sta nell'endpoint prerenderizzato `src/pages/og/[name].png.ts`.
 * Look neutro come il sito (M14): fondo scuro, titolo, sommario, etichetta di sezione.
 */

export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

export interface OgNode {
	type: string;
	props: { style?: Record<string, string | number>; children?: OgChild | OgChild[] };
}
type OgChild = OgNode | string;

const h = (
	type: string,
	style: Record<string, string | number>,
	children?: OgChild | OgChild[]
): OgNode => ({ type, props: { style, children } });

const COLORS = { bg: '#0b0b0c', fg: '#ececec', muted: '#8b8b90', line: '#26262a' };

/** Taglia un testo lungo a parola intera, con ellissi. */
export function clamp(text: string, max: number): string {
	if (text.length <= max) return text;
	const cut = text.slice(0, max);
	return `${cut.slice(0, cut.lastIndexOf(' ') > 0 ? cut.lastIndexOf(' ') : max).trimEnd()}…`;
}

export function ogLayout(params: { label: string; title: string; excerpt?: string }): OgNode {
	const { label, title, excerpt } = params;
	const titleSize = title.length > 60 ? 56 : title.length > 30 ? 68 : 84;
	return h(
		'div',
		{
			width: '100%',
			height: '100%',
			display: 'flex',
			flexDirection: 'column',
			justifyContent: 'space-between',
			padding: '72px 80px',
			background: COLORS.bg,
			color: COLORS.fg,
			fontFamily: 'Geist'
		},
		[
			h(
				'div',
				{ display: 'flex', justifyContent: 'space-between', fontSize: 26, color: COLORS.muted },
				[h('span', {}, 'simone salerno'), h('span', {}, label)]
			),
			h('div', { display: 'flex', flexDirection: 'column', gap: 24 }, [
				h(
					'div',
					{ fontSize: titleSize, fontWeight: 500, lineHeight: 1.08, letterSpacing: '-0.02em' },
					clamp(title, 90)
				),
				...(excerpt
					? [h('div', { fontSize: 30, lineHeight: 1.4, color: COLORS.muted }, clamp(excerpt, 160))]
					: [])
			]),
			h('div', { display: 'flex', height: 2, background: COLORS.line }, [])
		]
	);
}
