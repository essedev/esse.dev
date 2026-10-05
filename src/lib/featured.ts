/**
 * Reorders a collection with the featured items first, in the given order, followed by the
 * rest in the original order (already by date). Unknown ids are ignored and there are no
 * duplicates even if an id appears twice. It applies no limit: the caller cuts. Pure and
 * testable.
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
