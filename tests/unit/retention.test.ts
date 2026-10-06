import { describe, expect, it } from 'vitest';
import { expiresAt, RETENTION_DAYS } from '../../src/agent/retention';

describe('conversation retention', () => {
	it('expires 90 days after the last message', () => {
		const now = Date.UTC(2026, 9, 6, 12);
		expect(RETENTION_DAYS).toBe(90);
		expect(expiresAt(now)).toBe(Date.UTC(2027, 0, 4, 12));
	});
});
