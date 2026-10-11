import { describe, expect, it } from 'vitest';
import { splitEmphasis } from '../../src/lib/emphasis';

describe('splitEmphasis', () => {
	it('splits a line around its emphasized part', () => {
		expect(splitEmphasis('I bring AI in and *keep it running*.')).toEqual({
			before: 'I bring AI in and ',
			accent: 'keep it running',
			after: '.'
		});
	});

	it('keeps a line without emphasis whole', () => {
		expect(splitEmphasis('No accent here.')).toEqual({
			before: 'No accent here.',
			accent: '',
			after: ''
		});
	});

	it('takes the emphasis at the start or at the end', () => {
		expect(splitEmphasis('*All* of it')).toEqual({ before: '', accent: 'All', after: ' of it' });
		expect(splitEmphasis('a *guarantee*')).toEqual({
			before: 'a ',
			accent: 'guarantee',
			after: ''
		});
	});
});
