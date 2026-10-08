import { describe, expect, it } from 'vitest';
import {
	DRAFT_LIMITS,
	DraftError,
	mailBody,
	parseSend,
	todayCount,
	TURNSTILE_SITE_KEY,
	TURNSTILE_TEST_SITE_KEY,
	turnstileSiteKey
} from '../../src/agent/draft';

const valid = {
	draftId: 'call-1',
	subject: ' Collaborazione ',
	text: 'Ciao Simone, ...',
	contact: '',
	turnstile: 'token'
};

describe('parseSend', () => {
	it('trims the fields and lets the contact be empty', () => {
		expect(parseSend(valid)).toEqual({ ...valid, subject: 'Collaborazione' });
	});

	it('refuses a missing text, a missing Turnstile token and anything too long', () => {
		expect(() => parseSend({ ...valid, text: '  ' })).toThrow('text is empty');
		expect(() => parseSend({ ...valid, turnstile: undefined })).toThrow(DraftError);
		expect(() => parseSend({ ...valid, text: 'x'.repeat(DRAFT_LIMITS.textChars + 1) })).toThrow(
			'longer than'
		);
		expect(() => parseSend({ ...valid, subject: 42 })).toThrow('subject is empty');
	});
});

describe('mailBody', () => {
	it('carries the message, the contact and where it came from', () => {
		const body = mailBody({ ...valid, contact: 'ada@example.com' }, 'it');
		expect(body.startsWith('Ciao Simone')).toBe(true);
		expect(body).toContain('Contatto: ada@example.com');
		expect(mailBody(valid, 'en')).toContain('Contatto: non lasciato');
	});
});

describe('todayCount', () => {
	it('starts again from zero on a new day', () => {
		const now = new Date('2026-10-03T10:00:00Z');
		expect(todayCount({ day: '2026-10-03', count: 2 }, now).count).toBe(2);
		expect(todayCount({ day: '2026-10-02', count: 2 }, now)).toEqual({
			day: '2026-10-03',
			count: 0
		});
	});
});

describe('turnstileSiteKey', () => {
	it('uses the real key only on the production host', () => {
		expect(turnstileSiteKey('esse.dev')).toBe(TURNSTILE_SITE_KEY);
		expect(turnstileSiteKey('localhost')).toBe(TURNSTILE_TEST_SITE_KEY);
		expect(turnstileSiteKey('simonesalerno.it')).toBe(TURNSTILE_TEST_SITE_KEY);
	});

	it('lets a key set at build time win everywhere', () => {
		expect(turnstileSiteKey('esse.dev', 'built-in')).toBe('built-in');
		expect(turnstileSiteKey('localhost', 'built-in')).toBe('built-in');
	});
});
