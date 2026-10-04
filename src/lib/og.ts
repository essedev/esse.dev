/**
 * Layout delle immagini Open Graph (1200x630) come albero di elementi per satori. Puro:
 * il rendering a PNG sta nell'endpoint prerenderizzato `src/pages/og/[name].png.ts`.
 *
 * Direzione B del concept D (`docs/concepts/concept-d-og.html`), il terminale: in alto il
 * comando che apre la pagina (`whoami`, `ls progetti`, `cat progetti/relay.md`), il titolo
 * grande con il cursore lavanda del logo, il sommario, in basso i metadati in mono e il
 * dominio. Righe CRT appena visibili e un velo viola in alto a sinistra.
 *
 * Satori non legge le variabili CSS: i colori sono quelli di `@theme` in `global.css`,
 * ricopiati qui. Se cambia la palette, cambiano anche questi.
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

const COLORS = {
	bg: '#0a0a0d',
	fg: '#efedf5',
	text: '#cbc9d4',
	muted: '#9c9aa8',
	subtle: '#908e9b',
	faint: '#55535f',
	accent: '#b59cff',
	live: '#7dff9b',
	completed: '#efedf5',
	archived: '#4d4d58'
};

export type OgStatus = 'in-progress' | 'completed' | 'idea' | 'archived';

// Un `type` e non un'`interface`: le props di `getStaticPaths` vogliono un record.
export type OgData = {
	/** Il comando nel prompt in alto: `whoami`, `ls progetti`, `cat progetti/relay.md`. */
	command: string;
	title: string;
	excerpt?: string;
	/** I metadati in basso, in ordine: stato e anno, data e tag, o il ruolo. */
	meta: string[];
	/** Lo stato del progetto: un LED prima del primo metadato. */
	status?: OgStatus;
};

/** Taglia un testo lungo a parola intera, con ellissi. */
export function clamp(text: string, max: number): string {
	if (text.length <= max) return text;
	const cut = text.slice(0, max);
	return `${cut.slice(0, cut.lastIndexOf(' ') > 0 ? cut.lastIndexOf(' ') : max).trimEnd()}…`;
}

/** La taglia del titolo: grande se corto, più piccola se lungo, così sta in due righe. */
export function titleSize(title: string): number {
	return title.length > 50 ? 58 : title.length > 20 ? 84 : 112;
}

/** Il LED dello stato, come nel sito: pieno e acceso se vivo, vuoto se è un'idea. */
function led(status: OgStatus): OgNode {
	const base = { display: 'flex', width: 13, height: 13, borderRadius: 999 };
	if (status === 'idea') return h('div', { ...base, border: `2px solid ${COLORS.muted}` });
	if (status === 'in-progress') {
		return h('div', {
			...base,
			background: COLORS.live,
			boxShadow: '0 0 10px rgba(125, 255, 155, 0.75)'
		});
	}
	return h('div', {
		...base,
		background: status === 'completed' ? COLORS.completed : COLORS.archived
	});
}

export function ogLayout(data: OgData): OgNode {
	const { command, title, excerpt, meta, status } = data;
	const size = titleSize(title);
	const caretHeight = Math.round(size * 0.8);
	const metaItems: OgChild[] = meta.flatMap((item, i) => [
		...(i > 0 ? [h('span', { display: 'flex', color: COLORS.faint }, '·')] : []),
		h('span', { display: 'flex', alignItems: 'center', gap: 14 }, [
			...(i === 0 && status ? [led(status)] : []),
			item
		])
	]);

	return h(
		'div',
		{
			width: '100%',
			height: '100%',
			display: 'flex',
			flexDirection: 'column',
			justifyContent: 'space-between',
			padding: '64px 80px',
			backgroundColor: COLORS.bg,
			backgroundImage: [
				'repeating-linear-gradient(to bottom, rgba(255, 255, 255, 0.035) 0px, rgba(255, 255, 255, 0.035) 1px, rgba(0, 0, 0, 0) 1px, rgba(0, 0, 0, 0) 4px)',
				'radial-gradient(70% 90% at 15% 10%, rgba(110, 80, 255, 0.16), rgba(0, 0, 0, 0) 70%)'
			].join(', '),
			color: COLORS.fg,
			fontFamily: 'Geist'
		},
		[
			h(
				'div',
				{
					display: 'flex',
					alignItems: 'center',
					gap: 16,
					fontFamily: 'Departure Mono',
					fontSize: 28
				},
				[
					h('span', { display: 'flex', color: COLORS.accent }, '›'),
					h('span', { display: 'flex', color: COLORS.text }, command)
				]
			),
			h('div', { display: 'flex', flexDirection: 'column', gap: 26 }, [
				h(
					'div',
					{
						display: 'flex',
						flexWrap: 'wrap',
						alignItems: 'flex-end',
						columnGap: Math.round(size * 0.24),
						rowGap: Math.round(size * 0.12),
						fontSize: size,
						fontWeight: 500,
						letterSpacing: '-0.035em',
						lineHeight: 1,
						textShadow: '0 0 16px rgba(181, 156, 255, 0.45)'
					},
					// Parola per parola: su due righe il cursore segue l'ultima parola, non il bordo.
					[
						...clamp(title, 90)
							.split(' ')
							.map((word) => h('span', { display: 'flex' }, word)),
						h('div', {
							display: 'flex',
							width: Math.round(caretHeight * 0.55),
							height: caretHeight,
							marginLeft: -Math.round(size * 0.14),
							background: COLORS.accent,
							boxShadow: '0 0 18px rgba(181, 156, 255, 0.55)'
						})
					]
				),
				...(excerpt
					? [
							h(
								'div',
								{
									display: 'flex',
									fontSize: 29,
									lineHeight: 1.45,
									color: COLORS.text,
									maxWidth: 960
								},
								clamp(excerpt, 150)
							)
						]
					: [])
			]),
			h('div', { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, [
				h(
					'div',
					{
						display: 'flex',
						alignItems: 'center',
						gap: 18,
						fontFamily: 'Departure Mono',
						fontSize: 24,
						color: COLORS.muted
					},
					metaItems
				),
				h(
					'div',
					{ display: 'flex', fontFamily: 'Departure Mono', fontSize: 24, color: COLORS.fg },
					'esse.dev'
				)
			])
		]
	);
}
