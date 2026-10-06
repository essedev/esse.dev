/**
 * Suggestions for the 404: the pages closest to an address that does not exist, and the
 * words to search for in the list. Pure, called by the catch-all route on the Worker.
 */

/** A page the 404 can suggest: path with the language, title and kind for the label. */
export interface PageRef {
	path: string;
	title: string;
	/** The section the page belongs to, or `section` for the section's own page. */
	kind: string;
	/** For a detail page, the path of its section. */
	parent?: string;
}

/** Edit distance between two strings (insertions, deletions, substitutions). */
export function distance(a: string, b: string): number {
	let previous = Array.from({ length: b.length + 1 }, (_, i) => i);
	for (let i = 1; i <= a.length; i++) {
		const current = [i];
		for (let j = 1; j <= b.length; j++) {
			current[j] = Math.min(
				previous[j] + 1,
				current[j - 1] + 1,
				previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
			);
		}
		previous = current;
	}
	return previous[b.length];
}

/** The path without its first segment (the language), lowercase and without slashes at the ends. */
const rest = (path: string) => path.split('/').filter(Boolean).slice(1).join('/').toLowerCase();

/**
 * The pages closest to a path that does not exist, best first. `wanted` is the path after the
 * language. A page matches when the path is its own with a few typos (at most 2, or 30% of its
 * length) or its own with something after it; for a detail its section comes too, as a way
 * out. Nothing close, nothing: the 404 then offers search and agent.
 */
export function suggestPages(wanted: string, pages: PageRef[], max = 3): PageRef[] {
	let target: string;
	try {
		target = decodeURIComponent(wanted);
	} catch {
		target = wanted;
	}
	target = target.toLowerCase().replace(/^\/+|\/+$/g, '');
	if (!target) return [];

	const scored = pages
		.map((page) => {
			const own = rest(page.path);
			if (!own) return null;
			// Something after a real page (`/it/progetti/portsage/x`): that page, after a single typo
			// elsewhere and the longest first, so a project comes before its section.
			if (target.startsWith(`${own}/`)) return { page, score: 1 + 1 / own.length };
			const d = distance(target, own);
			return d <= Math.max(2, Math.floor(own.length * 0.3)) ? { page, score: d } : null;
		})
		.filter((s): s is { page: PageRef; score: number } => s !== null)
		.sort((a, b) => a.score - b.score);

	const result: PageRef[] = [];
	const add = (page: PageRef | undefined) => {
		if (page && result.length < max && !result.some((p) => p.path === page.path)) result.push(page);
	};
	for (const { page } of scored) {
		add(page);
		if (page.parent) add(pages.find((p) => p.path === page.parent));
	}
	return result;
}

/** The words of a path for the list search: no separators, no file extensions, at most 4. */
export function searchWords(wanted: string): string {
	let text: string;
	try {
		text = decodeURIComponent(wanted);
	} catch {
		text = wanted;
	}
	return text
		.toLowerCase()
		.replace(/\.[a-z0-9]{1,5}(?=\/|$)/g, '')
		.split(/[\s/_.\-+]+/)
		.filter((w) => w.length > 1 && !/^\d+$/.test(w))
		.slice(0, 4)
		.join(' ');
}
