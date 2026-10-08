import { dayKey } from './budget';

/**
 * `draft_message`: the agent writes a draft message to Simone, the visitor rereads it,
 * edits it and sends it. The model sends nothing: sending starts only from a click, after
 * Turnstile, within a daily cap per visitor and for the site, and only for a draft the
 * agent really wrote in this conversation.
 *
 * This is the pure part: limits, validation of what arrives from the browser, the email
 * text, the daily counters.
 */

/** Length limits of the draft fields and the daily send caps. */
export const DRAFT_LIMITS = {
	subjectChars: 120,
	textChars: 4000,
	contactChars: 200,
	/** Sends per day per visitor and for the whole site. */
	visitorDaily: 3,
	siteDaily: 30
} as const;

/**
 * Cloudflare's documented Turnstile test site key (it always passes): for every host but the
 * production one, where the real widget refuses to load (dev, preview, the E2E tests).
 */
export const TURNSTILE_TEST_SITE_KEY = '1x00000000000000000000AA';

/** The site key of the `esse.dev` widget: public, it ends up in the page anyway. */
export const TURNSTILE_SITE_KEY = '0x4AAAAAAFRKzBS1nK-oqJ2r';

/** The only host where the real widget, and its `TURNSTILE_SECRET`, are in use. */
const PRODUCTION_HOST = 'esse.dev';

/**
 * The site key for the page's host: the real one on `esse.dev`, the test one elsewhere. A
 * key set at build time (`PUBLIC_TURNSTILE_SITE_KEY`) wins everywhere.
 */
export function turnstileSiteKey(hostname: string, override?: string): string {
	if (override) return override;
	return hostname === PRODUCTION_HOST ? TURNSTILE_SITE_KEY : TURNSTILE_TEST_SITE_KEY;
}

/** The sender on the site's domain; the recipient is a secret (`MAIL_TO`). */
export const MAIL_FROM = 'agente@esse.dev';

/** A send request as it arrives from the browser, once validated. */
export interface DraftSend {
	draftId: string;
	subject: string;
	text: string;
	contact: string;
	turnstile: string;
}

/** A validation failure of a send request. */
export class DraftError extends Error {}

const field = (value: unknown, name: string, max: number, optional = false): string => {
	const s = typeof value === 'string' ? value.trim() : '';
	if (!s && !optional) throw new DraftError(`${name} is empty.`);
	if (s.length > max) throw new DraftError(`${name} is longer than ${max} characters.`);
	return s;
};

/** Validates what the browser sends for a send; throws `DraftError`. */
export function parseSend(message: Record<string, unknown>): DraftSend {
	return {
		draftId: field(message.draftId, 'draftId', 200),
		subject: field(message.subject, 'subject', DRAFT_LIMITS.subjectChars),
		text: field(message.text, 'text', DRAFT_LIMITS.textChars),
		contact: field(message.contact, 'contact', DRAFT_LIMITS.contactChars, true),
		turnstile: field(message.turnstile, 'turnstile', 4096)
	};
}

/** The email Simone receives: the visitor's message and how to reply. */
export function mailBody(send: DraftSend, lang: string): string {
	return [
		send.text,
		'',
		'--',
		`Contatto: ${send.contact || 'non lasciato'}`,
		`Lingua: ${lang}`,
		'Scritto con l’agente di esse.dev e approvato dal visitatore.'
	].join('\n');
}

/**
 * The kind of the transcript entry that tells the model how a draft's sending went. The
 * model reads it on its next turn; the page never shows it (`projectEntry`).
 */
export const DELIVERY_ENTRY = 'app.draft-delivery';

/** How the sending of an approved draft ended, as the model learns it. */
export type Delivery = { status: 'sent' } | { status: 'error'; reason: string };

/**
 * The note the model reads after a send: from the site, not from the visitor. It carries
 * the outcome and our own error message, never the draft's text, which is the visitor's.
 */
export function deliveryNote(delivery: Delivery, at: Date): string {
	const when = `${at.toISOString().slice(0, 16).replace('T', ' ')} UTC`;
	return delivery.status === 'sent'
		? `[Note from the site, not from the visitor] The visitor sent your draft to Simone at ${when}. It reached him: do not offer to draft it again, and if asked, confirm it was sent.`
		: `[Note from the site, not from the visitor] Sending your draft failed at ${when}: ${delivery.reason} Nothing reached Simone. If it comes up, say so plainly and suggest writing to hello@esse.dev.`;
}

/** A counter for one day. */
export interface DailyCount {
	day: string;
	count: number;
}

/** Today's counter: the saved one if it is from today, otherwise zero. */
export function todayCount(saved: DailyCount | undefined, now: Date): DailyCount {
	const day = dayKey(now);
	return saved?.day === day ? saved : { day, count: 0 };
}
