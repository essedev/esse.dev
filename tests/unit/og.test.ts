import { describe, expect, it } from 'vitest';
import { clamp, ogLayout, titleSize } from '../../src/lib/og';
import { escapeXml } from '../../src/lib/xml';

describe('clamp', () => {
	it('leaves short texts and cuts long ones at a whole word', () => {
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
	it('contains command, title, excerpt, metadata and domain', () => {
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
	it('shows the excerpt only if there is one, the LED only with a status', () => {
		const bare = JSON.stringify(ogLayout({ command: 'ls progetti', title: 'Progetti', meta: [] }));
		expect(bare).not.toContain('Terminale');
		expect(bare).not.toContain('#7dff9b');
		expect(JSON.stringify(ogLayout(relay))).toContain('#7dff9b');
	});
	it('shrinks long titles', () => {
		expect(titleSize('Relay')).toBeGreaterThan(titleSize('Architettura prima del codice'));
		expect(titleSize('Architettura prima del codice')).toBeGreaterThan(titleSize('x'.repeat(60)));
	});
});

describe('escapeXml', () => {
	it('escapes special characters', () => {
		expect(escapeXml(`<a href="x">Tom & 'Jerry'</a>`)).toBe(
			'&lt;a href=&quot;x&quot;&gt;Tom &amp; &#39;Jerry&#39;&lt;/a&gt;'
		);
	});
});
