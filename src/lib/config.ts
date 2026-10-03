import { z } from 'astro/zod';
import featuredJson from '../config/featured.json';
import languagesJson from '../config/languages.json';
import navigationJson from '../config/navigation.json';

// Configurazione del sito, validata all'import: un file rotto fa fallire la build.

export const LanguagesSchema = z
	.array(z.object({ code: z.string().min(2), name: z.string() }))
	.min(1);
export const NavigationSchema = z.record(
	z.string(),
	z.object({
		projects: z.string().min(1),
		articles: z.string().min(1),
		method: z.string().min(1),
		now: z.string().min(1),
		about: z.string().min(1),
		agent: z.string().min(1)
	})
);
export const FeaturedSchema = z.object({ projects: z.array(z.string().min(1)).max(6) });

export type Language = z.infer<typeof LanguagesSchema>[number];
export type NavigationConfig = z.infer<typeof NavigationSchema>;

export const languages = LanguagesSchema.parse(languagesJson);
export const navigation = NavigationSchema.parse(navigationJson);
export const featured = FeaturedSchema.parse(featuredJson);

export const languageCodes = languages.map((l) => l.code);
export const defaultLang = 'en';

for (const code of languageCodes) {
	if (!navigation[code]) throw new Error(`navigation.json: manca la lingua "${code}"`);
}
