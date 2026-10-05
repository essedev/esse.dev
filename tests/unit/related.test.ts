import { describe, expect, it } from 'vitest';
import { relatedByTags } from '../../src/lib/related';

const a = (id: string, tags: string[]) => ({ id, tags });
const all = [
	a('cur', ['x', 'y']),
	a('one', ['x']),
	a('two', ['x', 'y']),
	a('none', ['z']),
	a('three', ['y'])
];

describe('relatedByTags', () => {
	it('puts more shared tags first, keeps the given order on ties, excludes itself', () => {
		expect(relatedByTags(all[0], all).map((x) => x.id)).toEqual(['two', 'one', 'three']);
	});

	it('respects the limit and drops items with no shared tag', () => {
		expect(relatedByTags(all[0], all, 1).map((x) => x.id)).toEqual(['two']);
		expect(relatedByTags(a('solo', ['q']), all)).toEqual([]);
	});
});
