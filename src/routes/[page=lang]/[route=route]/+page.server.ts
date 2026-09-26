import type { FilterState, ProjectItem } from '$lib/types';
import { applyFilters, extractTags, extractStatuses } from '$lib/utils/searchUtils';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

const ITEMS_PER_PAGE = 6;

export const load: PageServerLoad = async ({ params, parent, url }) => {
	const lang = params.page as string;
	const route = params.route as string;
	const parentData = await parent();

	// Get route map for current language
	const routeMap = parentData.navigation[lang];
	if (!routeMap) {
		throw error(404, 'Language not found');
	}

	// Check if this is a valid list route
	const isProjectsRoute = route === routeMap.projects;
	const isArticlesRoute = route === routeMap.articles;

	if (!isProjectsRoute && !isArticlesRoute) {
		throw error(404, 'Page not found');
	}

	// Get query parameters from URL
	const page = parseInt(url.searchParams.get('page') || '1');
	const query = url.searchParams.get('query') || '';
	const tags = url.searchParams.get('tags')?.split(',') || [];
	const statuses = url.searchParams.get('statuses')?.split(',') || [];
	const sortBy = (url.searchParams.get('sortBy') as FilterState['sortBy']) || 'date';
	const sortOrder = (url.searchParams.get('sortOrder') as FilterState['sortOrder']) || 'desc';
	const from = url.searchParams.get('from') || undefined;
	const to = url.searchParams.get('to') || undefined;

	const filters: FilterState = {
		query,
		selectedTags: tags.filter(Boolean),
		selectedStatuses: statuses.filter(Boolean),
		dateRange: { from, to },
		sortBy,
		sortOrder
	};

	// Get the full list of data based on the route
	const allData = isProjectsRoute ? parentData.projects : parentData.articles;

	// Extract all available tags and statuses BEFORE filtering
	const availableTags = extractTags(allData, lang);
	const availableStatuses = isProjectsRoute ? extractStatuses(allData as ProjectItem[]) : [];

	// Apply filters to the data
	const filteredData = applyFilters(
		allData,
		filters,
		lang,
		isProjectsRoute ? 'projects' : 'articles'
	);

	// Apply pagination
	const totalItems = filteredData.length;
	const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
	const startIndex = (page - 1) * ITEMS_PER_PAGE;
	const endIndex = startIndex + ITEMS_PER_PAGE;
	const paginatedData = filteredData.slice(startIndex, endIndex);

	// Return page type and paginated data
	return {
		pageType: isProjectsRoute ? 'projects' : 'articles',
		items: paginatedData,
		pagination: {
			currentPage: page,
			totalPages,
			totalItems
		},
		activeFilters: filters,
		availableTags, // Pass all available tags
		availableStatuses, // Pass all available statuses
		currentLang: lang
	};
};
