/**
 * The emphasis of a line written in content as `*...*`: the home's headline and the method
 * quote put that part in the accent. A line without it is all `before`.
 */

/** A line split around its emphasized part. */
export interface Emphasis {
	before: string;
	accent: string;
	after: string;
}

/** The parts of a line around its first `*...*`. */
export function splitEmphasis(text: string): Emphasis {
	const match = /^([^*]*)\*([^*]+)\*(.*)$/s.exec(text);
	if (!match) return { before: text, accent: '', after: '' };
	return { before: match[1], accent: match[2], after: match[3] };
}
