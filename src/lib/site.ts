import { getEntry, type CollectionEntry } from 'astro:content';
import { languageCodes } from './config';

// Testi del sito per lingua, dalla collection `site` (src/content.config.ts). Lo schema
// rigido garantisce che ogni lingua abbia tutte le chiavi della UI.

export type SiteText = CollectionEntry<'site'>['data'];
export type UiKey = keyof SiteText['ui'];
export type Translate = (key: UiKey) => string;

export async function getSite(lang: string): Promise<SiteText> {
	const entry = await getEntry('site', lang);
	if (!entry)
		throw new Error(`content/site/${lang}.json mancante (lingue: ${languageCodes.join(', ')})`);
	return entry.data;
}

/** Traduttore per una lingua: `const t = await translator('it'); t('back')`. */
export async function translator(lang: string): Promise<Translate> {
	const { ui } = await getSite(lang);
	return (key) => ui[key];
}
