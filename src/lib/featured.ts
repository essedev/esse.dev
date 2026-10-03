/**
 * Riordina una collezione mettendo davanti gli item featured, nell'ordine dato, seguiti
 * dal resto nell'ordine originale (già per data). Gli id inesistenti sono ignorati e non
 * ci sono duplicati anche se un id compare due volte. Non applica limiti: il taglio lo
 * fa chi chiama. Pura e testabile.
 */
export function orderFeaturedFirst<T extends { id: string }>(
	items: T[],
	featuredIds: string[]
): T[] {
	const byId = new Map(items.map((item) => [item.id, item]));
	const seen = new Set<string>();
	const first: T[] = [];
	for (const id of featuredIds) {
		const item = byId.get(id);
		if (item && !seen.has(id)) {
			first.push(item);
			seen.add(id);
		}
	}
	return [...first, ...items.filter((item) => !seen.has(item.id))];
}
