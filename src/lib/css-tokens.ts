/**
 * Reads design tokens out of the site's stylesheet source, for the outputs that cannot load
 * it: the sitemap's CSS on XML takes its colors from here instead of copying them.
 */

/** The values of the custom properties `names`, declared directly in the rule `selector`. */
export function readTokens(
	css: string,
	selector: string,
	names: readonly string[]
): Record<string, string> {
	const source = css.replace(/\/\*[\s\S]*?\*\//g, '');
	const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	// Only a rule that starts a statement: `:root, :root[data-theme='light'] {` in a media
	// query is another rule, which repeats the selector in a list.
	const starts = [...source.matchAll(new RegExp(`(?:^|[{};])\\s*${escaped}\\s*\\{`, 'g'))];
	if (starts.length !== 1) {
		throw new Error(`readTokens: expected one rule "${selector}", found ${starts.length}`);
	}
	const open = starts[0].index + starts[0][0].length;

	// The rule's own declarations, without those of nested blocks.
	let depth = 1;
	let body = '';
	for (let i = open; i < source.length && depth > 0; i++) {
		const char = source[i];
		if (char === '{') depth++;
		else if (char === '}') depth--;
		else if (depth === 1) body += char;
	}
	if (depth > 0) throw new Error(`readTokens: rule "${selector}" is not closed`);

	const declared = new Map<string, string>();
	for (const declaration of body.split(';')) {
		const match = /^\s*(--[\w-]+)\s*:\s*([\s\S]+?)\s*$/.exec(declaration);
		if (match) declared.set(match[1], match[2]);
	}

	const tokens: Record<string, string> = {};
	for (const name of names) {
		const value = declared.get(name);
		if (value === undefined) throw new Error(`readTokens: ${name} missing in "${selector}"`);
		// The reader copies values, not the chain of variables behind them.
		if (value.includes('var(')) {
			throw new Error(`readTokens: ${name} in "${selector}" refers to another token`);
		}
		tokens[name] = value;
	}
	return tokens;
}
