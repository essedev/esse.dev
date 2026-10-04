/**
 * Limite di spesa dell'agente, in costo reale: si scala quello che pi-ai calcola per ogni
 * risposta (token per prezzo del modello), non una stima e non il numero di messaggi.
 * Chi fa domande leggere ne fa tante, chi fa lavorare l'agente meno.
 */

/** Dollari al giorno per visitatore e per tutto il sito. */
export const VISITOR_DAILY_USD = 0.1;
export const SITE_DAILY_USD = 2;

/**
 * Dollari al giorno per IP. Il visitatore è un id scelto dal browser: cambiandolo si aggira
 * il suo tetto, l'IP no. Cinque visitatori, perché uffici e reti mobili mettono tante
 * persone dietro lo stesso indirizzo.
 */
export const IP_DAILY_USD = 0.5;

/**
 * L'impronta di un IP per il giorno: SHA-256 di giorno e indirizzo, 16 caratteri. L'IP non
 * si salva in chiaro, e il giorno nel calcolo rende le impronte di giorni diversi
 * scollegate tra loro.
 */
export async function ipFingerprint(ip: string, now: Date): Promise<string> {
	const data = new TextEncoder().encode(`${dayKey(now)}:${ip}`);
	const hash = new Uint8Array(await crypto.subtle.digest('SHA-256', data));
	return [...hash.slice(0, 8)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * In pagina il budget si conta in crediti, non in centesimi: chi visita ragiona in domande.
 * Un credito è un centesimo di centesimo, quindi 1.000 al giorno; una domanda leggera ne
 * usa una decina. I conti restano in dollari, i crediti sono solo il modo di mostrarli.
 */
export const CREDIT_USD = 0.0001;

/** Crediti interi; una spesa vera non vale mai zero crediti. */
export function credits(usd: number): number {
	if (usd <= 0) return 0;
	return Math.max(1, Math.round(usd / CREDIT_USD));
}

/** Sotto questa quota del budget la pagina mostra quanti crediti restano. */
export const SHOW_BUDGET_BELOW = 0.3;

/** La mezzanotte UTC dopo `now`, quando il budget riparte. */
export function nextReset(now: Date): Date {
	return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
}

/** La giornata del limite, in UTC: `2026-10-03`. */
export function dayKey(now: Date): string {
	return now.toISOString().slice(0, 10);
}

export interface Spend {
	day: string;
	usd: number;
}

/** La spesa di oggi: quella salvata se è di oggi, altrimenti si riparte da zero. */
export function today(saved: Spend | undefined, now: Date): Spend {
	const day = dayKey(now);
	return saved?.day === day ? saved : { day, usd: 0 };
}

export function remaining(spend: Spend, limit: number): number {
	return Math.max(0, limit - spend.usd);
}

/** Il costo di una risposta: la somma dei messaggi del modello prodotti dalla richiesta. */
export function costOf(messages: readonly { usage?: { cost?: { total?: number } } }[]): number {
	return messages.reduce((sum, m) => sum + (m.usage?.cost?.total ?? 0), 0);
}
