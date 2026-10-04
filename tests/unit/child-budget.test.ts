import { describe, expect, it } from 'vitest';
import { CHILD_TOKEN_CAP, estimateTokens, overCap, usedTokens } from '../../src/agent/child-budget';

describe('child budget', () => {
	it('sums the tokens of every model the child used', () => {
		expect(usedTokens(undefined)).toBe(0);
		expect(
			usedTokens({
				models: {
					'openrouter/z-ai/glm-5.3-flash': { totalTokens: 9000 } as never,
					'openrouter/other': { totalTokens: 1000 } as never
				},
				tools: {}
			})
		).toBe(10_000);
	});

	it('asks for the answer when the next request would cross the cap', () => {
		expect(overCap(CHILD_TOKEN_CAP - 5000, 4000)).toBe(false);
		expect(overCap(CHILD_TOKEN_CAP - 5000, 6000)).toBe(true);
	});

	it('estimates a request at about four characters per token', () => {
		const tokens = estimateTokens([{ role: 'user', content: 'x'.repeat(4000), timestamp: 0 }]);
		expect(tokens).toBeGreaterThan(1000);
		expect(tokens).toBeLessThan(1100);
	});
});
