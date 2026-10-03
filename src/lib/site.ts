import { z } from 'astro/zod';
import { languageCodes } from './config';

// Testi del sito per lingua (titolo, descrizione, nomi delle sezioni, stringhe della UI).
// Le chiavi della UI sono quelle dell'inglese: ogni lingua deve averle tutte, e una
// chiave mancante fa fallire la build invece di comparire come segnaposto in pagina.

import en from '../content/site/en.json';

export type UiKey = keyof typeof en.ui;

const SiteSchema = z.object({
	title: z.string().min(1),
	description: z.string().min(1),
	keywords: z.array(z.string()),
	sections: z.object({ projects: z.string().min(1), articles: z.string().min(1) }),
	ui: z.record(z.string(), z.string().min(1))
});

export type SiteText = z.infer<typeof SiteSchema> & { ui: Record<UiKey, string> };

const files = import.meta.glob<{ default: unknown }>('../content/site/*.json', { eager: true });

const sites: Record<string, SiteText> = {};
for (const code of languageCodes) {
	const file = files[`../content/site/${code}.json`];
	if (!file) throw new Error(`content/site/${code}.json mancante`);
	const parsed = SiteSchema.parse(file.default);
	const missing = Object.keys(en.ui).filter((k) => !(k in parsed.ui));
	if (missing.length) throw new Error(`content/site/${code}.json: mancano ${missing.join(', ')}`);
	sites[code] = parsed as SiteText;
}

export function site(lang: string): SiteText {
	const s = sites[lang];
	if (!s) throw new Error(`Lingua senza testi: ${lang}`);
	return s;
}

/** Traduttore per una lingua: `const t = translator('it'); t('back')`. */
export function translator(lang: string): (key: UiKey) => string {
	const { ui } = site(lang);
	return (key) => ui[key];
}
