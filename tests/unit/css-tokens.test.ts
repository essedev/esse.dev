import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { readTokens } from '../../src/lib/css-tokens';

const css = `
@theme {
	/* The background. */
	--color-bg: #0a0a0d;
	--color-surface: rgb(255 255 255 / 0.05);
	--color-alias: var(--color-bg);
}
@layer base {
	:root[data-theme='light'] {
		--color-bg: #e9e5f1;
		.nested { --color-fg: #000; }
	}
	@media (width < 64rem) {
		:root,
		:root[data-theme='light'] {
			--color-fg: #111;
		}
	}
}
`;

describe('readTokens', () => {
	it('reads the declared values, comments aside', () => {
		expect(readTokens(css, '@theme', ['--color-bg', '--color-surface'])).toEqual({
			'--color-bg': '#0a0a0d',
			'--color-surface': 'rgb(255 255 255 / 0.05)'
		});
	});

	it('reads the rule that starts a statement, not a selector list repeating it', () => {
		expect(readTokens(css, ":root[data-theme='light']", ['--color-bg'])).toEqual({
			'--color-bg': '#e9e5f1'
		});
	});

	it('ignores declarations of nested blocks', () => {
		expect(() => readTokens(css, ":root[data-theme='light']", ['--color-fg'])).toThrow(
			/--color-fg missing/
		);
	});

	it('fails on a missing token, a missing rule or a token pointing to another', () => {
		expect(() => readTokens(css, '@theme', ['--color-gone'])).toThrow(/--color-gone missing/);
		expect(() => readTokens(css, '.absent', ['--color-bg'])).toThrow(/found 0/);
		expect(() => readTokens(css, '@theme', ['--color-alias'])).toThrow(/another token/);
	});

	it('finds every token the sitemap stylesheet needs in global.css, in both themes', () => {
		const source = readFileSync(new URL('../../src/styles/global.css', import.meta.url), 'utf8');
		const names = ['--color-bg', '--color-line', '--color-accent', '--color-subtle'];
		for (const selector of ['@theme', ":root[data-theme='light']"]) {
			const tokens = readTokens(source, selector, names);
			for (const value of Object.values(tokens)) expect(value).toMatch(/^#[0-9a-f]{6}$/);
		}
	});
});
