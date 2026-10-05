import { describe, expect, it } from 'vitest';
import { orderFeaturedFirst } from '../../src/lib/featured';

// The input simulates date order, most recent first: d, c, b, a.
const items = ['d', 'c', 'b', 'a'].map((id) => ({ id }));
const ids = (list: { id: string }[]) => list.map((i) => i.id);

describe('orderFeaturedFirst', () => {
	it("mette i featured davanti nell'ordine dato, poi il resto invariato", () => {
		expect(ids(orderFeaturedFirst(items, ['a', 'c']))).toEqual(['a', 'c', 'd', 'b']);
	});

	it("senza featured lascia l'ordine originale", () => {
		expect(ids(orderFeaturedFirst(items, []))).toEqual(['d', 'c', 'b', 'a']);
	});

	it('ignora gli id inesistenti', () => {
		expect(ids(orderFeaturedFirst(items, ['x', 'b']))).toEqual(['b', 'd', 'c', 'a']);
	});

	it('non duplica se un id compare due volte', () => {
		expect(ids(orderFeaturedFirst(items, ['a', 'a']))).toEqual(['a', 'd', 'c', 'b']);
	});
});
