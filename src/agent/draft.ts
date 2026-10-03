import { dayKey } from './budget';

/**
 * `draft_message`: l'agente scrive una bozza di messaggio a Simone, il visitatore la
 * rilegge, la corregge e la manda lui. Il modello non spedisce niente: l'invio parte solo
 * da un clic, dopo Turnstile, entro un tetto giornaliero per visitatore e per il sito, e
 * solo per una bozza che l'agente ha scritto davvero in questa conversazione.
 *
 * Qui la parte pura: limiti, validazione di quello che arriva dal browser, il testo
 * dell'email, i contatori del giorno.
 */

export const DRAFT_LIMITS = {
	subjectChars: 120,
	textChars: 4000,
	contactChars: 200,
	/** Invii al giorno per visitatore e per tutto il sito. */
	visitorDaily: 3,
	siteDaily: 30
} as const;

/**
 * La chiave pubblica di prova di Turnstile (passa sempre), documentata da Cloudflare: vale
 * finché non c'è `PUBLIC_TURNSTILE_SITE_KEY` alla build. In produzione serve quella vera,
 * con il suo `TURNSTILE_SECRET`.
 */
export const TURNSTILE_TEST_SITE_KEY = '1x00000000000000000000AA';

/** Il mittente sul dominio del sito; il destinatario è un secret (`MAIL_TO`). */
export const MAIL_FROM = 'agente@esse.dev';

export interface DraftSend {
	draftId: string;
	subject: string;
	text: string;
	contact: string;
	turnstile: string;
}

export class DraftError extends Error {}

const field = (value: unknown, name: string, max: number, optional = false): string => {
	const s = typeof value === 'string' ? value.trim() : '';
	if (!s && !optional) throw new DraftError(`${name} is empty.`);
	if (s.length > max) throw new DraftError(`${name} is longer than ${max} characters.`);
	return s;
};

/** Valida quello che il browser manda per un invio; lancia `DraftError`. */
export function parseSend(message: Record<string, unknown>): DraftSend {
	return {
		draftId: field(message.draftId, 'draftId', 200),
		subject: field(message.subject, 'subject', DRAFT_LIMITS.subjectChars),
		text: field(message.text, 'text', DRAFT_LIMITS.textChars),
		contact: field(message.contact, 'contact', DRAFT_LIMITS.contactChars, true),
		turnstile: field(message.turnstile, 'turnstile', 4096)
	};
}

/** L'email che arriva a Simone: il messaggio del visitatore e come rispondergli. */
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

export interface DailyCount {
	day: string;
	count: number;
}

/** Il contatore di oggi: quello salvato se è di oggi, altrimenti zero. */
export function todayCount(saved: DailyCount | undefined, now: Date): DailyCount {
	const day = dayKey(now);
	return saved?.day === day ? saved : { day, count: 0 };
}
