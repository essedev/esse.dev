import { describe, expect, it } from 'vitest';
import {
	DELIVERY_ENTRY,
	deliveryNote,
	DRAFT_LIMITS,
	DraftError,
	mailBody,
	parseSend,
	todayCount,
	TURNSTILE_SITE_KEY,
	TURNSTILE_TEST_SITE_KEY,
	turnstileSiteKey
} from '../../src/agent/draft';
import { projectEntry } from '../../src/agent/transcript';
import type { EntryRecord } from '@earendil-works/pi-durable';

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

describe('deliveryNote', () => {
	const at = new Date('2026-10-08T10:11:00Z');

	it('tells the model the draft reached Simone, from the site and not the visitor', () => {
		const note = deliveryNote({ status: 'sent' }, at);
		expect(note).toContain('[Note from the site, not from the visitor]');
		expect(note).toContain('2026-10-08 10:11 UTC');
		expect(note).toContain('do not offer to draft it again');
	});

	it('carries our reason on a failure and points to the address', () => {
		const note = deliveryNote({ status: 'error', reason: 'At most 3 messages a day.' }, at);
		expect(note).toContain('At most 3 messages a day.');
		expect(note).toContain('Nothing reached Simone');
		expect(note).toContain('hello@esse.dev');
	});

	it('is kept off the page: the chat does not show it as the visitor speaking', () => {
		const entry = {
			id: 7,
			conversationId: 1,
			kind: DELIVERY_ENTRY,
			model: [{ role: 'user', content: deliveryNote({ status: 'sent' }, at), timestamp: 0 }],
			data: { draftId: 'call-1', status: 'sent' }
		} as unknown as EntryRecord;
		expect(projectEntry(entry)).toBeUndefined();
	});
});
