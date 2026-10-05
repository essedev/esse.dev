/**
 * Spending limits of the agent, in real cost: what pi-ai computes for each response (tokens
 * times model price) is deducted, not an estimate and not a message count. Light questions
 * are cheap, so a visitor can ask many; heavy work uses the budget faster.
 */

/** Daily dollars per visitor. */
export const VISITOR_DAILY_USD = 0.1;

/** Daily dollars for the whole site. */
export const SITE_DAILY_USD = 2;

/**
 * Daily dollars per IP. The visitor is an id chosen by the browser, so changing it bypasses
 * its cap; the IP cannot be changed that way. Set to five visitors, because offices and
 * mobile networks put many people behind one address.
 */
export const IP_DAILY_USD = 0.5;

/**
 * The fingerprint of an IP for the day: SHA-256 of day and address, 16 characters. The IP is
 * never stored in the clear, and the day in the input makes fingerprints of different days
 * unlinkable.
 */
export async function ipFingerprint(ip: string, now: Date): Promise<string> {
	const data = new TextEncoder().encode(`${dayKey(now)}:${ip}`);
	const hash = new Uint8Array(await crypto.subtle.digest('SHA-256', data));
	return [...hash.slice(0, 8)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * The page shows the budget in credits, not cents: visitors think in questions. A credit is
 * a hundredth of a cent, so 1,000 per day; a light question uses about ten. Accounting stays
 * in dollars, credits are only how they are shown.
 */
export const CREDIT_USD = 0.0001;

/** Whole credits; a real spend is never worth zero credits. */
export function credits(usd: number): number {
	if (usd <= 0) return 0;
	return Math.max(1, Math.round(usd / CREDIT_USD));
}

/** Below this share of the budget the page shows how many credits are left. */
export const SHOW_BUDGET_BELOW = 0.3;

/** The UTC midnight after `now`, when the budget resets. */
export function nextReset(now: Date): Date {
	return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
}

/** The day of the limit, in UTC: `2026-10-03`. */
export function dayKey(now: Date): string {
	return now.toISOString().slice(0, 10);
}

/** The amount spent on one day. */
export interface Spend {
	day: string;
	usd: number;
}

/** Today's spend: the saved one if it is from today, otherwise zero. */
export function today(saved: Spend | undefined, now: Date): Spend {
	const day = dayKey(now);
	return saved?.day === day ? saved : { day, usd: 0 };
}

/** What is left of `limit` after `spend`, never below zero. */
export function remaining(spend: Spend, limit: number): number {
	return Math.max(0, limit - spend.usd);
}

/** The cost of a response: the sum over the model messages the request produced. */
export function costOf(messages: readonly { usage?: { cost?: { total?: number } } }[]): number {
	return messages.reduce((sum, m) => sum + (m.usage?.cost?.total ?? 0), 0);
}
