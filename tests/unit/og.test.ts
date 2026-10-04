import { describe, expect, it } from 'vitest';
import { clamp, ogLayout, titleSize } from '../../src/lib/og';
import { escapeXml } from '../../src/lib/xml';

describe('clamp', () => {
	it('lascia i testi corti e taglia i lunghi a parola intera', () => {
		expect(clamp('breve', 10)).toBe('breve');
		expect(clamp('una frase un po lunga', 12)).toBe('una frase…');
	});
});

describe('ogLayout', () => {
	const relay = {
		command: 'cat progetti/relay.md',
		title: 'Relay',
		excerpt: 'Terminale',
		meta: ['in corso', '2026'],
		status: 'in-progress' as const
	};
	it('contiene comando, titolo, sommario, metadati e dominio', () => {
		const tree = JSON.stringify(ogLayout(relay));
		for (const text of [
			'cat progetti/relay.md',
			'Relay',
			'Terminale',
			'in corso',
			'2026',
			'esse.dev'
		]) {
			expect(tree).toContain(text);
		}
	});
	it('il sommario solo se c’è, il LED solo con uno stato', () => {
		const bare = JSON.stringify(ogLayout({ command: 'ls progetti', title: 'Progetti', meta: [] }));
		expect(bare).not.toContain('Terminale');
		expect(bare).not.toContain('#7dff9b');
		expect(JSON.stringify(ogLayout(relay))).toContain('#7dff9b');
	});
	it('rimpicciolisce i titoli lunghi', () => {
		expect(titleSize('Relay')).toBeGreaterThan(titleSize('Architettura prima del codice'));
		expect(titleSize('Architettura prima del codice')).toBeGreaterThan(titleSize('x'.repeat(60)));
	});
});

describe('escapeXml', () => {
	it('esegue l’escape dei caratteri speciali', () => {
		expect(escapeXml(`<a href="x">Tom & 'Jerry'</a>`)).toBe(
			'&lt;a href=&quot;x&quot;&gt;Tom &amp; &#39;Jerry&#39;&lt;/a&gt;'
		);
	});
});
