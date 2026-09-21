// ==================================================
// SISTEMA DI TIPI COMPLETO PER CONTENUTI LOCALI
// ==================================================

// Tipi base
export interface Language {
	code: string;
	name: string;
}

export interface LinkItem {
	name: string;
	link: string;
}

export interface InterfaceItem {
	name: string;
	value: string;
}

// Struttura ContentBlocks (formato custom per contenuti strutturati)
export interface ContentBlockData {
	text?: string;
	items?: string[]; // Per liste
	level?: number; // Per headers (h1-h6)
	src?: string; // Per immagini
	alt?: string; // Per immagini
	language?: string; // Per code blocks
	layout?: 'full' | 'left' | 'right'; // Layout per immagini
	size?: 'small' | 'medium' | 'large'; // Dimensione per immagini con layout left/right
	width?: string; // Larghezza personalizzata (es. "300px", "50%")
	height?: string; // Altezza personalizzata (es. "200px", "auto")
	[key: string]: unknown; // Per supportare altri tipi di blocchi
}

export interface ContentBlock {
	id?: string;
	type: 'paragraph' | 'header' | 'list' | 'image' | 'code' | 'quote' | 'divider';
	data: ContentBlockData;
}

export interface ContentBlocks {
	blocks: ContentBlock[];
	time?: number;
	version?: string;
}

// ==================================================
// CONFIG TYPES
// ==================================================

export type NavigationConfig = Record<string, Record<string, string>>;

export interface ConfigFiles {
	languages: Language[];
	navigation: NavigationConfig;
}

// ==================================================
// CONTENT TYPES
// ==================================================

// Global Content
export interface GlobalContent {
	title: string;
	description: string;
	keywords: string[];
	navigation: LinkItem[];
	interface: InterfaceItem[];
	tagTranslations: Record<string, string>;
}

// Page Content (Welcome, About, Contact, Projects, Blog)
export interface WelcomeContent {
	eyebrow: string;
	title: string;
	description: ContentBlocks;
}

export interface AboutContent {
	title: string;
	description: ContentBlocks;
}

export interface ContactContent {
	title: string;
	subtitle: string;
	links: LinkItem[];
}

export interface ProjectsPageContent {
	title: string;
}

export interface BlogPageContent {
	title: string;
}

// Collection Item Metadata
export interface ProjectMeta {
	id: string;
	images: string[];
	featured_image: string;
	featuredImagePlaceholder?: boolean;
	og_image_key?: string;
	link?: string;
	published: boolean;
	status: 'completed' | 'in-progress' | 'idea' | 'archived';
	created_date: string;
	updated_date: string;
}

export interface ArticleMeta {
	id: string;
	featured_image: string;
	featuredImagePlaceholder?: boolean;
	og_image_key?: string;
	published: boolean;
	published_date: string;
	created_date: string;
	updated_date: string;
}

// Collection Item Translations
export interface ProjectTranslation {
	slug: string;
	title: string;
	excerpt: string;
	content: ContentBlocks;
	image_captions: string[];
	tags: string[];
}

export interface ArticleTranslation {
	slug: string;
	title: string;
	excerpt: string;
	content: ContentBlocks;
	meta_description: string;
	tags: string[];
}

// Collection Items
export interface ProjectItem {
	translations: Record<string, ProjectTranslation>;
	meta: ProjectMeta;
}

export interface ArticleItem {
	translations: Record<string, ArticleTranslation>;
	meta: ArticleMeta;
}

// ==================================================
// SLUG MAP TYPE
// ==================================================

export type SlugMap = Record<string, Record<string, string>>;
export interface SlugMapData {
	projects: SlugMap;
	articles: SlugMap;
}

export interface LayoutData {
	selectedLanguage: string;
	languages: Language[];
	navigation: NavigationConfig;
	global: GlobalContent;
	welcome: WelcomeContent;
	about: AboutContent;
	contact: ContactContent;
	projectsPage: ProjectsPageContent;
	blogPage: BlogPageContent;
	projects: ProjectItem[];
	articles: ArticleItem[];
	slugMap: SlugMapData;
	/** Id del tema accento scelto (dal cookie), per applicarlo già in SSR. */
	accent: string;
}

// ==================================================
// PAGE DATA TYPES
// ==================================================

export interface DetailPageData {
	type: 'project' | 'article';
	content: ProjectItem | ArticleItem;
	currentLang: string;
	related?: ArticleItem[];
}

// ==================================================
// COMPONENT PROP TYPES
// ==================================================

// Language Selector Props
export interface LanguageSelectorProps {
	languages: Language[];
	selectedLanguage: string;
	navigation: NavigationConfig;
	slugMap: SlugMapData;
}

// Card Component Props
export interface ProjectCardProps {
	title: string;
	excerpt: string;
	featuredImage?: string;
	featuredImagePlaceholder?: boolean;
	link: string;
	tags?: string[];
	status?: 'completed' | 'in-progress' | 'idea' | 'archived';
	year?: string;
	global: GlobalContent | null | undefined;
}

export interface ArticleCardProps {
	title: string;
	excerpt: string;
	featuredImage?: string;
	featuredImagePlaceholder?: boolean;
	link: string;
	publishedDate: string;
	tags: string[];
}

// Section Component Props
export interface ProjectsSectionProps {
	projects: ProjectItem[];
	selectedLanguage: string;
	navigation: NavigationConfig;
	projectsPage: ProjectsPageContent;
	showFilters?: boolean;
	showViewAllButton?: boolean;
	global?: GlobalContent;
	/** Indice numerato della sezione, lo stesso della navbar e del rail. */
	index?: number;
	/** Collezione completa per il readout: nel listing `projects` e' solo la pagina. */
	collection?: ProjectItem[];
}

export interface ArticlesSectionProps {
	articles: ArticleItem[];
	selectedLanguage: string;
	navigation: NavigationConfig;
	blogPage: BlogPageContent;
	showFilters?: boolean;
	showViewAllButton?: boolean;
	global?: GlobalContent;
	index?: number;
	collection?: ArticleItem[];
}

export interface ProjectSectionProps {
	content: ProjectItem;
	currentLang: string;
	global?: GlobalContent;
	navigation?: NavigationConfig;
}

export interface ArticleSectionProps {
	content: ArticleItem;
	currentLang: string;
	global?: GlobalContent;
	related?: ArticleItem[];
	navigation?: NavigationConfig;
}

export interface WelcomeSectionProps {
	welcome: WelcomeContent;
}

export interface AboutSectionProps {
	about: AboutContent;
	index?: number;
}

export interface ContactSectionProps {
	contact: ContactContent;
	index?: number;
}

// Navigation Component Props
export interface NavbarProps {
	data: LayoutData;
	menuOpen: boolean;
}

export interface FooterProps {
	data: LayoutData;
}

export interface FloatingNavProps {
	data: LayoutData;
	menuOpen: boolean;
}

// ==================================================
// CONTENT LOADER TYPES
// ==================================================

export type ConfigFileNames = 'languages' | 'navigation' | 'featured';
export type PageNames = 'welcome' | 'about' | 'contact' | 'projects' | 'blog';
export type ContentType = 'project' | 'article';

// Cache types
export type CacheKey =
	| `config-${ConfigFileNames}`
	| `global-${string}`
	| `page-${PageNames}-${string}`
	| `projects-${string}`
	| 'projects-all'
	| `articles-${string}`
	| 'articles-all'
	| 'slug-map';

// Curatela della vetrina home: id progetto ordinati, max 6. La selezione e
// l'ordine vivono qui, disaccoppiati dai meta. Solo la home la usa.
export interface FeaturedConfig {
	projects: string[];
}

// Return types for ContentLoader methods
export interface LoadConfigReturn {
	languages: Language[];
	navigation: NavigationConfig;
}

export type LoadConfigType<T extends ConfigFileNames> = T extends 'languages'
	? Language[]
	: T extends 'navigation'
		? NavigationConfig
		: T extends 'featured'
			? FeaturedConfig
			: never;

// ==================================================
// UTILITY TYPES
// ==================================================

// Type guards
export function isProjectItem(item: ProjectItem | ArticleItem): item is ProjectItem {
	return 'status' in item.meta;
}

export function isArticleItem(item: ProjectItem | ArticleItem): item is ArticleItem {
	return 'published_date' in item.meta;
}

// Helper types for translation access
export type ProjectTranslationKey = keyof ProjectTranslation;
export type ArticleTranslationKey = keyof ArticleTranslation;

// Route parameter types
export interface RouteParams {
	page: string;
	sub?: string;
}

// Specific type for detail page params (workaround for SvelteKit param naming issue)
export interface DetailPageParams {
	page: string; // This will be the language code
	route?: string; // This will be the route type (projects/articles)
	sub?: string; // This will be the slug
}

// Filter types
export interface FilterState {
	query: string;
	selectedTags: string[];
	selectedStatuses: string[];
	dateRange: {
		from?: string;
		to?: string;
	};
	sortBy: 'date' | 'title' | 'relevance';
	sortOrder: 'asc' | 'desc';
}

// Sitemap types
export interface Page {
	slug: string;
	lastMod: string;
	priority: number;
	hreflang: string;
}

export interface SitemapPage {
	slug: string;
	lastMod: string;
	priority: number;
	changefreq: string;
	hreflang: string;
	alternates?: Array<{ hreflang: string; href: string }>;
}

// Error page types
export interface ErrorPageState {
	global: GlobalContent | null;
	currentLang: string;
}
