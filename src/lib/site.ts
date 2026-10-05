import { getEntry, type CollectionEntry } from 'astro:content';
import { languageCodes } from './config';

/**
 * The site texts per language, from the `site` collection (`src/content.config.ts`). The
 * strict schema guarantees every language has all the UI keys.
 */

/** The texts of one language. */
export type SiteText = CollectionEntry<'site'>['data'];
/** A key of the UI strings. */
export type UiKey = keyof SiteText['ui'];
/** Looks up a UI string. */
export type Translate = (key: UiKey) => string;

/** The site texts of one language. */
export async function getSite(lang: string): Promise<SiteText> {
	const entry = await getEntry('site', lang);
	if (!entry)
		throw new Error(`content/site/${lang}.json mancante (lingue: ${languageCodes.join(', ')})`);
	return entry.data;
}

/** A translator for a language: `const t = await translator('it'); t('back')`. */
export async function translator(lang: string): Promise<Translate> {
	const { ui } = await getSite(lang);
	return (key) => ui[key];
}
