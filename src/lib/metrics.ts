/**
 * Reading metrics from the Markdown of an article. The token estimate is approximate and
 * must be shown with "~": it does not replace a tokenizer. It is based on characters (more
 * stable than words) and tuned per language, because BPE tokenizers fragment Italian more
 * than English. Code blocks count toward tokens, not toward reading time.
 */

const CHARS_PER_TOKEN: Record<string, number> = { it: 3.5, en: 4 };
const FENCE = /^```[^\n]*\n([\s\S]*?)^```/gm;

/** Splits the prose (without Markdown syntax) from the code of fenced blocks. */
export function splitMarkdown(markdown: string): { prose: string; code: string } {
	const code: string[] = [];
	const withoutCode = markdown.replace(FENCE, (_, body: string) => {
		code.push(body);
		return '';
	});
	const prose = withoutCode
		.replace(/`([^`]*)`/g, '$1')
		.replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
		.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
		.replace(/^[ \t]{0,3}(#{1,6}|>|[-*+]|\d+[.)])[ \t]+/gm, '')
		.replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, '$1')
		.replace(/^[ \t]*(-{3,}|\*{3,})[ \t]*$/gm, '')
		.trim();
	return { prose, code: code.join('\n') };
}

/** The number of whitespace-separated words. */
export function countWords(text: string): number {
	const trimmed = text.trim();
	return trimmed ? trimmed.split(/\s+/).length : 0;
}

/** Reading minutes (at least 1 if there is text), at ~200 words per minute. */
export function readingTimeMinutes(words: number, wpm = 200): number {
	return words <= 0 ? 0 : Math.max(1, Math.round(words / wpm));
}

/** A rough token count from a character count, tuned per language. */
export function estimateTokens(charCount: number, lang = 'en'): number {
	return Math.round(charCount / (CHARS_PER_TOKEN[lang] ?? CHARS_PER_TOKEN.en));
}

/** 850 -> "850", 3210 -> "3.2k". */
export function formatTokens(tokens: number): string {
	return tokens >= 1000 ? `${(tokens / 1000).toFixed(1)}k` : String(tokens);
}

/** Words, reading minutes and estimated tokens of a Markdown text. */
export function readingMetrics(markdown: string, lang = 'en') {
	const { prose, code } = splitMarkdown(markdown);
	const words = countWords(prose);
	const tokens = estimateTokens(prose.length + code.length, lang);
	return { words, minutes: readingTimeMinutes(words), tokens, tokensLabel: formatTokens(tokens) };
}
