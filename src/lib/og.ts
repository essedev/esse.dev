/**
 * Layout of the Open Graph images (1200x630) as an element tree for satori. Pure: the PNG
 * rendering lives in the prerendered endpoint `src/pages/og/[name].png.ts`.
 *
 * Direction B of concept D (`docs/concepts/concept-d-og.html`), the terminal: on top the
 * command that opens the page (`whoami`, `ls progetti`, `cat progetti/relay.md`), the large
 * title with the logo's lavender caret, the excerpt, at the bottom the metadata in mono and
 * the domain. Barely visible CRT lines and a violet veil at the top left.
 *
 * Satori does not read CSS variables: the colors are those of `@theme` in `global.css`,
 * copied here. If the palette changes, these change too.
 */

/** Width of the image, in pixels. */
export const OG_WIDTH = 1200;

/** Height of the image, in pixels. */
export const OG_HEIGHT = 630;

/** A node of the satori element tree. */
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

/** The status of a project, as the LED shows it. */
export type OgStatus = 'in-progress' | 'maintained' | 'completed' | 'idea' | 'archived';

/**
 * What one image shows. A `type` and not an `interface`: the props of `getStaticPaths` want
 * a record.
 */
export type OgData = {
	/** The command in the prompt on top: `whoami`, `ls progetti`, `cat progetti/relay.md`. */
	command: string;
	title: string;
	excerpt?: string;
	/** The metadata at the bottom, in order: status and year, date and tag, or the role. */
	meta: string[];
	/** The project status: an LED before the first metadata item. */
	status?: OgStatus;
};

/** Cuts a long text at a whole word, with an ellipsis. */
export function clamp(text: string, max: number): string {
	if (text.length <= max) return text;
	const cut = text.slice(0, max);
	return `${cut.slice(0, cut.lastIndexOf(' ') > 0 ? cut.lastIndexOf(' ') : max).trimEnd()}…`;
}

/** The title size: large if short, smaller if long, so it fits in two lines. */
export function titleSize(title: string): number {
	return title.length > 50 ? 58 : title.length > 20 ? 84 : 112;
}

/** The status LED, as on the site: lit if alive (steady if maintained), empty if an idea. */
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
	if (status === 'maintained') {
		return h('div', {
			...base,
			background: COLORS.live,
			boxShadow: '0 0 5px rgba(125, 255, 155, 0.4)'
		});
	}
	return h('div', {
		...base,
		background: status === 'completed' ? COLORS.completed : COLORS.archived
	});
}

/** The element tree of the image for `data`. */
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
					// Word by word: on two lines the caret follows the last word, not the edge.
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
