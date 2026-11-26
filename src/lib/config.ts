import { z } from 'astro/zod';
import featuredJson from '../config/featured.json';
import languagesJson from '../config/languages.json';
import navigationJson from '../config/navigation.json';
import tagsJson from '../config/tags.json';

/**
 * The site configuration (languages, routes per language, showcase, project tags), validated on
 * import: a broken file fails the build.
 */

/** Schema of `languages.json`. */
export const LanguagesSchema = z
	.array(z.object({ code: z.string().min(2), name: z.string() }))
	.min(1);
/** Schema of `navigation.json`: the localized route of each section, per language. */
export const NavigationSchema = z.record(
	z.string(),
	z.object({
		projects: z.string().min(1),
		articles: z.string().min(1),
		method: z.string().min(1),
		now: z.string().min(1),
		about: z.string().min(1),
		agent: z.string().min(1),
		privacy: z.string().min(1),
		changelog: z.string().min(1)
	})
);
/** Schema of `featured.json`: the showcase, at most six projects, and the home's method note. */
export const FeaturedSchema = z.object({
	projects: z.array(z.string().min(1)).max(6),
	method: z.string().min(1).optional()
});

/**
 * Schema of `tags.json`: the closed vocabulary of the project tags, id -> label per language.
 * The tags are what a visitor filters by; the detailed technologies go in a project's `stack`.
 */
export const TagsSchema = z.record(
	z.string().regex(/^[a-z0-9-]+$/),
	z.record(z.string(), z.string().min(1))
);

/** A language of the site. */
export type Language = z.infer<typeof LanguagesSchema>[number];
/** The localized routes, per language. */
export type NavigationConfig = z.infer<typeof NavigationSchema>;

/** The validated languages. */
export const languages = LanguagesSchema.parse(languagesJson);
/** The validated routes per language. */
export const navigation = NavigationSchema.parse(navigationJson);
/** The validated project tags. */
export const tags = TagsSchema.parse(tagsJson);
/** The validated showcase. */
export const featured = FeaturedSchema.parse(featuredJson);

/** The codes of the languages, in configured order. */
export const languageCodes = languages.map((l) => l.code);
/** The language of the default home. */
export const defaultLang = 'en';

for (const code of languageCodes) {
	if (!navigation[code]) throw new Error(`navigation.json: manca la lingua "${code}"`);
}
for (const [id, labels] of Object.entries(tags)) {
	for (const code of languageCodes)
		if (!labels[code]) throw new Error(`tags.json: tag "${id}" has no label in "${code}"`);
}

/** The ids of the project tags, in the order of `tags.json`. */
export const tagIds = Object.keys(tags) as [string, ...string[]];

/** The label of a project tag in one language. */
export function tagLabel(id: string, lang: string): string {
	return tags[id]?.[lang] ?? id;
}
