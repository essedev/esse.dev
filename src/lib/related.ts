/**
 * Articoli correlati: quelli con più tag in comune con l'articolo corrente, escluso lui
 * stesso, a parità di tag nell'ordine dato (che è già per data). Pura e testabile.
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
