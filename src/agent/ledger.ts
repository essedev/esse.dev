import { DurableObject } from 'cloudflare:workers';
import { SITE_DAILY_USD, remaining, today, type Spend } from './budget';
import { DRAFT_LIMITS, todayCount, type DailyCount } from './draft';

/**
 * La spesa di tutto il sito in un giorno: un Durable Object solo (`idFromName('site')`),
 * così i visitatori, che hanno ognuno il proprio oggetto, scalano dallo stesso conto.
 * Un oggetto serializza le chiamate, quindi due addebiti insieme non si perdono. Tiene
 * anche il conto dei messaggi a Simone spediti oggi da tutto il sito.
 */
export class Ledger extends DurableObject<Env> {
	async #spend(): Promise<Spend> {
		return today(await this.ctx.storage.get<Spend>('spend'), new Date());
	}

	async remaining(): Promise<number> {
		return remaining(await this.#spend(), SITE_DAILY_USD);
	}

	async charge(usd: number): Promise<number> {
		const spend = await this.#spend();
		const next = { day: spend.day, usd: spend.usd + usd };
		await this.ctx.storage.put('spend', next);
		return remaining(next, SITE_DAILY_USD);
	}

	/** Prende un posto tra i messaggi di oggi; `false` se il tetto del sito è pieno. */
	async takeMessage(): Promise<boolean> {
		const sent = todayCount(await this.ctx.storage.get<DailyCount>('messages'), new Date());
		if (sent.count >= DRAFT_LIMITS.siteDaily) return false;
		await this.ctx.storage.put('messages', { day: sent.day, count: sent.count + 1 });
		return true;
	}
}
