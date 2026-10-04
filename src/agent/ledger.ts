import { DurableObject } from 'cloudflare:workers';
import { IP_DAILY_USD, SITE_DAILY_USD, remaining, today, type Spend } from './budget';
import { DRAFT_LIMITS, todayCount, type DailyCount } from './draft';

/**
 * La spesa di tutto il sito in un giorno: un Durable Object solo (`idFromName('site')`),
 * così i visitatori, che hanno ognuno il proprio oggetto, scalano dallo stesso conto.
 * Un oggetto serializza le chiamate, quindi due addebiti insieme non si perdono. Tiene
 * anche la spesa di oggi per impronta di IP (`ip:<impronta>`, cancellata al cambio di
 * giorno) e il conto dei messaggi a Simone spediti oggi da tutto il sito.
 */
export class Ledger extends DurableObject<Env> {
	async #spend(): Promise<Spend> {
		const saved = await this.ctx.storage.get<Spend>('spend');
		const spend = today(saved, new Date());
		// Giorno nuovo: le impronte di ieri non servono più (e non tornerebbero, il giorno è
		// nel loro calcolo).
		if (saved && saved.day !== spend.day) {
			const old = await this.ctx.storage.list({ prefix: 'ip:' });
			await this.ctx.storage.delete([...old.keys()]);
		}
		return spend;
	}

	async #ipSpend(ip: string): Promise<Spend> {
		return today(await this.ctx.storage.get<Spend>(`ip:${ip}`), new Date());
	}

	/** Quanto resta oggi al sito e, se c'è, all'impronta di IP: il minimo dei due. */
	async remaining(ip?: string): Promise<number> {
		const site = remaining(await this.#spend(), SITE_DAILY_USD);
		if (!ip) return site;
		return Math.min(site, remaining(await this.#ipSpend(ip), IP_DAILY_USD));
	}

	async charge(usd: number, ip?: string): Promise<number> {
		const spend = await this.#spend();
		const next = { day: spend.day, usd: spend.usd + usd };
		await this.ctx.storage.put('spend', next);
		if (ip) {
			const own = await this.#ipSpend(ip);
			await this.ctx.storage.put(`ip:${ip}`, { day: own.day, usd: own.usd + usd });
		}
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
