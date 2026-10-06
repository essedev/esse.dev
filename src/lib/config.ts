import { z } from 'astro/zod';
import featuredJson from '../config/featured.json';
import languagesJson from '../config/languages.json';
import navigationJson from '../config/navigation.json';

/**
 * The site configuration (languages, routes per language, showcase), validated on import:
 * a broken file fails the build.
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
		privacy: z.string().min(1)
	})
);
/** Schema of `featured.json`: the showcase, at most six projects. */
export const FeaturedSchema = z.object({ projects: z.array(z.string().min(1)).max(6) });

/** A language of the site. */
export type Language = z.infer<typeof LanguagesSchema>[number];
/** The localized routes, per language. */
export type NavigationConfig = z.infer<typeof NavigationSchema>;

/** The validated languages. */
export const languages = LanguagesSchema.parse(languagesJson);
/** The validated routes per language. */
export const navigation = NavigationSchema.parse(navigationJson);
/** The validated showcase. */
export const featured = FeaturedSchema.parse(featuredJson);

/** The codes of the languages, in configured order. */
export const languageCodes = languages.map((l) => l.code);
/** The language of the default home. */
export const defaultLang = 'en';

for (const code of languageCodes) {
	if (!navigation[code]) throw new Error(`navigation.json: manca la lingua "${code}"`);
}
