/**
 * Metriche di lettura dal Markdown di un articolo. La stima token è approssimata e va
 * mostrata con "~": non sostituisce un tokenizer. È basata sui caratteri (più stabile
 * delle parole) e tarata per lingua, perché i tokenizer BPE frammentano l'italiano più
 * dell'inglese. I blocchi di codice contano per i token, non per il tempo di lettura.
 */

const CHARS_PER_TOKEN: Record<string, number> = { it: 3.5, en: 4 };
const FENCE = /^```[^\n]*\n([\s\S]*?)^```/gm;

/** Separa la prosa (senza sintassi Markdown) dal codice dei blocchi recintati. */
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

export function countWords(text: string): number {
	const trimmed = text.trim();
	return trimmed ? trimmed.split(/\s+/).length : 0;
}

/** Minuti di lettura (almeno 1 se c'è testo), a ~200 parole al minuto. */
export function readingTimeMinutes(words: number, wpm = 200): number {
	return words <= 0 ? 0 : Math.max(1, Math.round(words / wpm));
}

export function estimateTokens(charCount: number, lang = 'en'): number {
	return Math.round(charCount / (CHARS_PER_TOKEN[lang] ?? CHARS_PER_TOKEN.en));
}

/** 850 -> "850", 3210 -> "3.2k". */
export function formatTokens(tokens: number): string {
	return tokens >= 1000 ? `${(tokens / 1000).toFixed(1)}k` : String(tokens);
}

export function readingMetrics(markdown: string, lang = 'en') {
	const { prose, code } = splitMarkdown(markdown);
	const words = countWords(prose);
	const tokens = estimateTokens(prose.length + code.length, lang);
	return { words, minutes: readingTimeMinutes(words), tokens, tokensLabel: formatTokens(tokens) };
}
