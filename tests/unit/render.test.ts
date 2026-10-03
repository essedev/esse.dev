import { describe, expect, it } from 'vitest';
import { isNumeric, parseRender, RENDER_LIMITS, RenderError } from '../../src/agent/render';

describe('parseRender', () => {
	it('keeps bars with numbers, even when the model sends them as text', () => {
		expect(
			parseRender({
				type: 'bars',
				title: 'Progetti per anno',
				items: [
					{ label: '2025', value: '4' },
					{ label: '2026', value: 9 }
				]
			})
		).toEqual({
			type: 'bars',
			title: 'Progetti per anno',
			unit: undefined,
			items: [
				{ label: '2025', value: 4 },
				{ label: '2026', value: 9 }
			]
		});
	});

	it('refuses negative or missing amounts, naming the field', () => {
		expect(() =>
			parseRender({ type: 'bars', title: 't', items: [{ label: 'a', value: -1 }] })
		).toThrow('items[0].value');
		expect(() => parseRender({ type: 'bars', title: 't', items: [{ label: 'a' }] })).toThrow(
			RenderError
		);
	});

	it('wants one cell per column in a table', () => {
		const ok = parseRender({
			type: 'table',
			title: 't',
			columns: ['Progetto', 'Stack'],
			rows: [['Relay', 'Swift']]
		});
		expect(ok.type === 'table' && ok.rows).toEqual([['Relay', 'Swift']]);
		expect(() =>
			parseRender({ type: 'table', title: 't', columns: ['a', 'b'], rows: [['x']] })
		).toThrow('rows[0] has 1 cells');
	});

	it('caps the size and the text', () => {
		const items = Array.from({ length: RENDER_LIMITS.items + 1 }, (_, i) => ({
			date: '2026',
			label: String(i)
		}));
		expect(() => parseRender({ type: 'timeline', title: 't', items })).toThrow('more than');
		expect(() =>
			parseRender({ type: 'timeline', title: 'x'.repeat(RENDER_LIMITS.text + 1), items: [] })
		).toThrow('title');
	});

	it('refuses unknown views and anything that is not data', () => {
		expect(() => parseRender({ type: 'html', title: 't' })).toThrow('type must be');
		expect(() => parseRender('<script>')).toThrow('arguments');
	});
});

describe('isNumeric', () => {
	it('right-aligns numbers and percentages only', () => {
		expect(isNumeric('1.234,5')).toBe(true);
		expect(isNumeric('42 %')).toBe(true);
		expect(isNumeric('2026-07')).toBe(false);
		expect(isNumeric('Swift')).toBe(false);
	});
});
