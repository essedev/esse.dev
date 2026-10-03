import { describe, expect, it } from 'vitest';
import { clamp, ogLayout } from '../../src/lib/og';
import { escapeXml } from '../../src/lib/xml';

describe('clamp', () => {
	it('lascia i testi corti e taglia i lunghi a parola intera', () => {
		expect(clamp('breve', 10)).toBe('breve');
		expect(clamp('una frase un po lunga', 12)).toBe('una frase…');
	});
});

describe('ogLayout', () => {
	it('contiene titolo ed etichetta, il sommario solo se c’è', () => {
		const withExcerpt = JSON.stringify(
			ogLayout({ label: 'progetti', title: 'Relay', excerpt: 'Terminale' })
		);
		expect(withExcerpt).toContain('Relay');
		expect(withExcerpt).toContain('progetti');
		expect(withExcerpt).toContain('Terminale');
		expect(JSON.stringify(ogLayout({ label: 'x', title: 'Solo titolo' }))).not.toContain('excerpt');
	});
});

describe('escapeXml', () => {
	it('esegue l’escape dei caratteri speciali', () => {
		expect(escapeXml(`<a href="x">Tom & 'Jerry'</a>`)).toBe(
			'&lt;a href=&quot;x&quot;&gt;Tom &amp; &#39;Jerry&#39;&lt;/a&gt;'
		);
	});
});
