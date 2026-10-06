/**
 * How long a visitor's conversation is kept: 90 days from the last message, then the whole
 * object is emptied (transcript, drafts, spend). The privacy page states the same number.
 * "Nuova conversazione" does not delete: it starts a new context in the same object, and
 * the earlier messages stay until this deadline.
 */
export const RETENTION_DAYS = 90;

/** The id and function of the expiry job in the object's Lifecycle queue. */
export const EXPIRE_JOB = 'expire';

/** When a conversation last active at `now` expires, in epoch milliseconds. */
export function expiresAt(now: number): number {
	return now + RETENTION_DAYS * 24 * 60 * 60 * 1000;
}
