/**
 * Phosphor on the answer being streamed (concept G): the characters that just arrived are
 * born in the accent and cool down to the text color, like a CRT trace. The markdown is
 * rendered again on every delta, so after each update the young characters are wrapped
 * again, with the animation moved back by their age: it continues instead of restarting.
 */

/** How long a character glows; the `phosphor` animation in global.css lasts the same. */
const LIFE_MS = 1100;

type Arrival = { start: number; end: number; at: number };

/**
 * Svelte action for the container of a text part. `live` is false once the message is
 * stored: then nothing glows and nothing is wrapped.
 */
export function phosphor(node: HTMLElement, params: { text: string; live: boolean }) {
	let arrivals: Arrival[] = [];
	// Mounted while streaming, the first words are young too.
	let length = params.live ? 0 : (node.textContent?.length ?? 0);

	function mark(live: boolean) {
		// Color only, no displacement: it stays with reduced motion too (DECISIONS #25).
		if (!live) return;
		const now = performance.now();
		const total = node.textContent?.length ?? 0;
		if (total > length) arrivals.push({ start: length, end: total, at: now });
		length = total;
		arrivals = arrivals.filter((a) => now - a.at < LIFE_MS);
		if (arrivals.length === 0) return;

		const texts: Text[] = [];
		const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
		while (walker.nextNode()) texts.push(walker.currentNode as Text);

		let offset = 0;
		for (const text of texts) {
			const from = offset;
			offset += text.data.length;
			// The top-level nodes are the ones Svelte's {@html} tracks to replace them on the next
			// delta: moving one into a span would leave old text behind. Markdown puts every word
			// inside a block, so only the newlines between blocks stay out.
			if (text.parentNode === node || !text.data.trim()) continue;
			const segments = arrivals
				.map((a) => ({ start: Math.max(a.start, from), end: Math.min(a.end, offset), at: a.at }))
				.filter((s) => s.start < s.end)
				.sort((a, b) => b.start - a.start);
			// From the end, so the offsets of the earlier segments stay valid in `text`.
			for (const segment of segments) {
				const young = text.splitText(segment.start - from);
				young.splitText(segment.end - segment.start);
				const span = document.createElement('span');
				span.className = 'phosphor';
				// CSSOM, not a style attribute: the CSP blocks only the latter.
				span.style.animationDelay = `-${Math.round(now - segment.at)}ms`;
				young.replaceWith(span);
				span.append(young);
			}
		}
	}

	mark(params.live);

	return {
		update(next: { text: string; live: boolean }) {
			mark(next.live);
		}
	};
}
