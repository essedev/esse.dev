/**
 * Related articles: those sharing the most tags with the current one, excluding itself; on
 * ties, the given order (already by date). Pure and testable.
 */
export function relatedByTags<T extends { id: string; tags: string[] }>(
	current: T,
	all: T[],
	limit = 3
): T[] {
	const tags = new Set(current.tags);
	return all
		.filter((item) => item.id !== current.id)
		.map((item, index) => ({ item, index, shared: item.tags.filter((t) => tags.has(t)).length }))
		.filter((x) => x.shared > 0)
		.sort((a, b) => b.shared - a.shared || a.index - b.index)
		.slice(0, limit)
		.map((x) => x.item);
}
