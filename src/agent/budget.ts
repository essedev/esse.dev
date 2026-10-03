/**
 * Limite di spesa dell'agente, in costo reale: si scala quello che pi-ai calcola per ogni
 * risposta (token per prezzo del modello), non una stima e non il numero di messaggi.
 * Chi fa domande leggere ne fa tante, chi fa lavorare l'agente meno.
 */

/** Dollari al giorno per visitatore e per tutto il sito. */
export const VISITOR_DAILY_USD = 0.05;
export const SITE_DAILY_USD = 2;

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
