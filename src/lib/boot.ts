import { MODEL } from '../agent/models';
import { getArticles, getChangelog, getMethod, getProjects } from './content';
import { getSite, type SiteText } from './site';

/**
 * What the boot shows (DECISIONS #37), gathered at build time: the build, the counts of the
 * collections, the agent's model and the latest changelog entries, with the lines in the
 * page's language. Workspace.astro hands it to src/scripts/boot.ts in a data attribute.
 */

/** The most recent entries whose titles travel with the page: the short boot names five. */
const NEWS_WINDOW = 10;

/** The fonts the boot waits for, the ones astro.config.mjs loads. */
const FONTS = ['Departure Mono', 'Geist', 'Geist Mono'];

/** The data of the boot, serializable. */
export interface BootData {
	/**
	 * Every changelog entry: one the visitor has not seen starts the short boot. A set and not
	 * the latest id, because entries of the same day have no order of their own.
	 */
	ids: string[];
	/** The latest entries, most recent first, to name the unseen ones. */
	news: { id: string; title: string }[];
	commit: string;
	/** The build day, `YYYY-MM-DD`. */
	date: string;
	counts: { projects: number; method: number; articles: number; releases: number };
	model: string;
	fonts: string[];
	text: SiteText['boot'];
}

/** The boot's data for a language. */
export async function getBootData(lang: string): Promise<BootData> {
	const [projects, method, articles, changelog, site] = await Promise.all([
		getProjects(lang),
		getMethod(lang),
		getArticles(lang),
		getChangelog(lang),
		getSite(lang)
	]);
	return {
		ids: changelog.map((c) => c.id),
		news: changelog.slice(0, NEWS_WINDOW).map((c) => ({ id: c.id, title: c.title })),
		commit: import.meta.env.BUILD_COMMIT,
		date: import.meta.env.BUILD_DATE,
		counts: {
			projects: projects.length,
			method: method.length,
			articles: articles.length,
			releases: changelog.length
		},
		model: MODEL.id,
		fonts: FONTS,
		text: site.boot
	};
}
