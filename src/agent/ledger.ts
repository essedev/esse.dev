import { DurableObject } from 'cloudflare:workers';
import { SITE_DAILY_USD, remaining, today, type Spend } from './budget';

/**
 * La spesa di tutto il sito in un giorno: un Durable Object solo (`idFromName('site')`),
 * così i visitatori, che hanno ognuno il proprio oggetto, scalano dallo stesso conto.
 * Un oggetto serializza le chiamate, quindi due addebiti insieme non si perdono.
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
}
