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
	it('più tag in comune prima, a parità conta l’ordine dato, escluso se stesso', () => {
		expect(relatedByTags(all[0], all).map((x) => x.id)).toEqual(['two', 'one', 'three']);
	});

	it('rispetta il limite e scarta chi non ha tag in comune', () => {
		expect(relatedByTags(all[0], all, 1).map((x) => x.id)).toEqual(['two']);
		expect(relatedByTags(a('solo', ['q']), all)).toEqual([]);
	});
});
