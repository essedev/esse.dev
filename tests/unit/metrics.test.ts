import { describe, expect, it } from 'vitest';
import {
	countWords,
	estimateTokens,
	formatTokens,
	readingMetrics,
	readingTimeMinutes,
	splitMarkdown
} from '../../src/lib/metrics';

describe('splitMarkdown', () => {
	it('toglie la sintassi e lascia il testo', () => {
		const md =
			'## Titolo\n\nUn [link](https://x.y) e **grassetto**.\n\n- uno\n- due\n\n> citazione';
		expect(splitMarkdown(md).prose).toBe('Titolo\n\nUn link e grassetto.\n\nuno\ndue\n\ncitazione');
	});

	it('separa i blocchi di codice dalla prosa', () => {
		const { prose, code } = splitMarkdown('Testo.\n\n```ts\nconst a = 1;\n```\n');
		expect(prose).toBe('Testo.');
		expect(code).toBe('const a = 1;\n');
	});
});

describe('metriche', () => {
	it('parole, minuti (almeno 1) e token per lingua', () => {
		expect(countWords('  uno due   tre ')).toBe(3);
		expect(readingTimeMinutes(0)).toBe(0);
		expect(readingTimeMinutes(50)).toBe(1);
		expect(readingTimeMinutes(1000)).toBe(5);
		expect(estimateTokens(350, 'it')).toBe(100);
		expect(estimateTokens(400, 'en')).toBe(100);
	});

	it('formato compatto dei token', () => {
		expect(formatTokens(850)).toBe('850');
		expect(formatTokens(3210)).toBe('3.2k');
	});

	it('il codice conta per i token ma non per le parole', () => {
		const m = readingMetrics('Due parole.\n\n```\nmolto codice qui dentro\n```\n', 'en');
		expect(m.words).toBe(2);
		expect(m.tokens).toBeGreaterThan(estimateTokens('Due parole.'.length, 'en'));
	});
});
