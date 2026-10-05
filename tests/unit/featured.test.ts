import { describe, expect, it } from 'vitest';
import { orderFeaturedFirst } from '../../src/lib/featured';

// The input simulates date order, most recent first: d, c, b, a.
const items = ['d', 'c', 'b', 'a'].map((id) => ({ id }));
const ids = (list: { id: string }[]) => list.map((i) => i.id);

describe('orderFeaturedFirst', () => {
	it('puts the featured first in the given order, then the rest unchanged', () => {
		expect(ids(orderFeaturedFirst(items, ['a', 'c']))).toEqual(['a', 'c', 'd', 'b']);
	});

	it('keeps the original order without featured ids', () => {
		expect(ids(orderFeaturedFirst(items, []))).toEqual(['d', 'c', 'b', 'a']);
	});

	it('ignores unknown ids', () => {
		expect(ids(orderFeaturedFirst(items, ['x', 'b']))).toEqual(['b', 'd', 'c', 'a']);
	});

	it('does not duplicate an id that appears twice', () => {
		expect(ids(orderFeaturedFirst(items, ['a', 'a']))).toEqual(['a', 'd', 'c', 'b']);
	});
});
