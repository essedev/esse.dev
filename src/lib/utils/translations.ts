import type { GlobalContent } from '$lib/types';

// Type-safe translation keys based on global interface
export type TranslationKey =
	| 'readMore'
	| 'viewProject'
	| 'backHome'
	| 'loading'
	| 'noProjects'
	| 'noArticles'
	| 'viewAll'
	| 'tags'
	| 'searchTags'
	| 'clearFilters'
	| 'sortNewest'
	| 'sortOldest'
	| 'sortTitleAZ'
	| 'sortTitleZA'
	| 'searchProjects'
	| 'searchArticles'
	| 'removeFilter'
	| 'closeTagDropdown'
	| 'backToTop'
	| 'copyright'
	| 'logo'
	| 'placeholder'
	| 'simoneSalerno'
	| 'noResultsFound'
	| 'tryAdjusting'
	| 'pageNotFound'
	| 'back'
	| 'dateRange'
	| 'from'
	| 'to'
	| 'sort'
	| 'apply'
	| 'clearTags'
	| 'clearDates'
	| 'status'
	| 'statusCompleted'
	| 'statusInProgress'
	| 'statusIdea'
	| 'statusArchived'
	| 'clearStatuses'
	| 'closeStatusDropdown'
	| 'shelfArchived'
	| 'shelfIdeas'
	| 'noProjectsHome'
	| 'noArticlesHome'
	| 'checkBackLater';

// Translation map cache
const translationCache = new Map<string, Record<string, string>>();

/**
 * Preprocesses global interface array into a key-value object for fast lookups
 */
export function createTranslationMap(global: GlobalContent): Record<string, string> {
	const cacheKey = `${global.title}-${global.description?.slice(0, 50) || 'default'}`;

	if (translationCache.has(cacheKey)) {
		return translationCache.get(cacheKey)!;
	}

	const translationMap: Record<string, string> = {};

	if (global.interface) {
		for (const item of global.interface) {
			translationMap[item.name] = item.value || `[MISSING_TRANSLATION: ${item.name}]`;
		}
	}

	translationCache.set(cacheKey, translationMap);
	return translationMap;
}

/**
 * Gets a translation by key with fallback handling
 */
export function getTranslation(
	global: GlobalContent | null | undefined,
	key: TranslationKey,
	fallback?: string
): string {
	if (!global) {
		return fallback || `[MISSING_TRANSLATION: ${key}]`;
	}

	const translationMap = createTranslationMap(global);
	return translationMap[key] || fallback || `[MISSING_TRANSLATION: ${key}]`;
}

/**
 * Gets multiple translations at once for better performance
 */
export function getTranslations(
	global: GlobalContent | null | undefined,
	keys: TranslationKey[]
): Record<TranslationKey, string> {
	if (!global) {
		const result: Record<string, string> = {};
		for (const key of keys) {
			result[key] = `[MISSING_TRANSLATION: ${key}]`;
		}
		return result;
	}

	const translationMap = createTranslationMap(global);
	const result: Record<string, string> = {};

	for (const key of keys) {
		result[key] = translationMap[key] || `[MISSING_TRANSLATION: ${key}]`;
	}

	return result;
}

/**
 * Translates a tag using the global tag translations
 */
export function translateTag(global: GlobalContent | null | undefined, tag: string): string {
	if (!global || !global.tagTranslations) {
		return tag;
	}

	return global.tagTranslations[tag] || tag;
}

/**
 * Translates multiple tags at once
 */
export function translateTags(global: GlobalContent | null | undefined, tags: string[]): string[] {
	if (!global || !global.tagTranslations) {
		return tags;
	}

	return tags.map((tag) => global.tagTranslations[tag] || tag);
}
