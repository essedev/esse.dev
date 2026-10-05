import { DurableObject } from 'cloudflare:workers';
import { IP_DAILY_USD, SITE_DAILY_USD, remaining, today, type Spend } from './budget';
import { DRAFT_LIMITS, todayCount, type DailyCount } from './draft';

/**
 * The spend of the whole site in a day: a single Durable Object (`idFromName('site')`), so
 * visitors, who each have their own object, are charged against the same account. An object
 * serializes calls, so two charges at once are not lost. It also keeps today's spend per IP
 * fingerprint (`ip:<fingerprint>`, deleted when the day changes) and the count of messages
 * to Simone sent today from the whole site.
 */
export class Ledger extends DurableObject<Env> {
	async #spend(): Promise<Spend> {
		const saved = await this.ctx.storage.get<Spend>('spend');
		const spend = today(saved, new Date());
		// New day: yesterday's fingerprints are no longer needed (and would not recur, since the
		// day is part of their input).
		if (saved && saved.day !== spend.day) {
			const old = await this.ctx.storage.list({ prefix: 'ip:' });
			await this.ctx.storage.delete([...old.keys()]);
		}
		return spend;
	}

	async #ipSpend(ip: string): Promise<Spend> {
		return today(await this.ctx.storage.get<Spend>(`ip:${ip}`), new Date());
	}

	/** What is left today for the site and, if given, the IP fingerprint: the minimum of the two. */
	async remaining(ip?: string): Promise<number> {
		const site = remaining(await this.#spend(), SITE_DAILY_USD);
		if (!ip) return site;
		return Math.min(site, remaining(await this.#ipSpend(ip), IP_DAILY_USD));
	}

	/** Adds a spend to the site and IP accounts and returns what is left for the site. */
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

	/** Takes a slot among today's messages; `false` if the site cap is full. */
	async takeMessage(): Promise<boolean> {
		const sent = todayCount(await this.ctx.storage.get<DailyCount>('messages'), new Date());
		if (sent.count >= DRAFT_LIMITS.siteDaily) return false;
		await this.ctx.storage.put('messages', { day: sent.day, count: sent.count + 1 });
		return true;
	}
}
