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
	it('strips the syntax and keeps the text', () => {
		const md =
			'## Titolo\n\nUn [link](https://x.y) e **grassetto**.\n\n- uno\n- due\n\n> citazione';
		expect(splitMarkdown(md).prose).toBe('Titolo\n\nUn link e grassetto.\n\nuno\ndue\n\ncitazione');
	});

	it('separates code blocks from prose', () => {
		const { prose, code } = splitMarkdown('Testo.\n\n```ts\nconst a = 1;\n```\n');
		expect(prose).toBe('Testo.');
		expect(code).toBe('const a = 1;\n');
	});
});

describe('reading metrics', () => {
	it('counts words, minutes (at least 1) and tokens per language', () => {
		expect(countWords('  uno due   tre ')).toBe(3);
		expect(readingTimeMinutes(0)).toBe(0);
		expect(readingTimeMinutes(50)).toBe(1);
		expect(readingTimeMinutes(1000)).toBe(5);
		expect(estimateTokens(350, 'it')).toBe(100);
		expect(estimateTokens(400, 'en')).toBe(100);
	});

	it('formats tokens compactly', () => {
		expect(formatTokens(850)).toBe('850');
		expect(formatTokens(3210)).toBe('3.2k');
	});

	it('counts code toward tokens but not toward words', () => {
		const m = readingMetrics('Due parole.\n\n```\nmolto codice qui dentro\n```\n', 'en');
		expect(m.words).toBe(2);
		expect(m.tokens).toBeGreaterThan(estimateTokens('Due parole.'.length, 'en'));
	});
});
