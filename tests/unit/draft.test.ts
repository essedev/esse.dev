import { describe, expect, it } from 'vitest';
import { DRAFT_LIMITS, DraftError, mailBody, parseSend, todayCount } from '../../src/agent/draft';

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
