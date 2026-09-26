<script lang="ts">
	import { browser } from '$app/environment';
	import { page } from '$app/state';
	import FloatingNav from '$lib/components/FloatingNav.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import Navbar from '$lib/components/Navbar.svelte';
	import BackToTop from '$lib/components/ui/BackToTop.svelte';
	import '$lib/styles/globals.css';
	import { initializeAnalytics, isAnalyticsReady, trackPageView } from '$lib/utils/analytics';
	import {
		blogPostingJsonLd,
		buildAlternates,
		buildCanonical,
		creativeWorkJsonLd,
		personJsonLd,
		serializeJsonLd,
		socialLinks,
		websiteJsonLd
	} from '$lib/utils/seo';
	import { isValidLanguage, isValidRouteForLang, sectionOf } from '$lib/utils/i18n';

	let { children, data } = $props();

	let scrollY = $state(0);
	let menuOpen = $state(false);

	let isLanguageCodeValid = $derived(
		isValidLanguage(page.url.pathname.split('/')[1], data.languages)
	);

	$effect(() => {
		if (browser) {
			document.documentElement.classList.toggle('overflow-hidden', menuOpen);
			document.documentElement.classList.toggle('sm:overflow-auto', menuOpen);
		}
	});

	$effect(() => {
		if (browser) {
			const handleScroll = () => {
				scrollY = window.scrollY;
			};
			window.addEventListener('scroll', handleScroll);
			return () => window.removeEventListener('scroll', handleScroll);
		}
	});

	// Initialize analytics on mount
	$effect(() => {
		if (browser) {
			initializeAnalytics();
		}
	});

	// Track page views on navigation
	$effect(() => {
		if (browser && page.url && isAnalyticsReady()) {
			trackPageView(page.url.pathname + page.url.search);
		}
	});

	// Detect if current page is in error state or has invalid content
	let isPageError = $derived.by(() => {
		// Check if we're on an error page
		if (page.error) return true;

		const currentRoute = page.route.id;
		const params = page.params;

		// Validate language first
		if (params.page && !isValidLanguage(params.page, data.languages)) return true;

		// For detail pages, check if content exists
		if (currentRoute === '/[page=lang]/[route=route]/[sub]') {
			const pageData = page.data;
			if (!pageData?.content) return true;
		}

		// For listing pages, validate route against navigation
		if (currentRoute === '/[page=lang]/[route=route]') {
			if (!params.page || !params.route) return true;
			if (!isValidRouteForLang(params.route, params.page, data.navigation)) return true;
		}

		return false;
	});

	// Dynamic title based on current route with error handling
	let pageTitle = $derived.by(() => {
		if (!data?.global?.title) return 'Simone Salerno';

		// If page is in error state, return default title
		if (isPageError) {
			return `Simone Salerno • ${data.global.title}`;
		}

		const currentRoute = page.route.id;
		const params = page.params;

		// Home page
		if (currentRoute === '/[page=lang]') {
			return `Simone Salerno • ${data.global.title}`;
		}

		// Projects/Articles listing pages
		if (currentRoute === '/[page=lang]/[route=route]' && params.page && params.route) {
			const routeType = sectionOf(params.route, params.page, data.navigation);
			if (routeType === 'projects') {
				return `Simone Salerno • ${data.projectsPage?.title || 'Projects'}`;
			} else if (routeType === 'blog') {
				return `Simone Salerno • ${data.blogPage?.title || 'Blog'}`;
			}
		}

		// Individual project/article pages
		if (currentRoute === '/[page=lang]/[route=route]/[sub]') {
			const pageData = page.data;
			if (pageData?.content?.translations?.[pageData.currentLang]?.title) {
				return `Simone Salerno • ${pageData.content.translations[pageData.currentLang].title}`;
			}
		}

		// Fallback
		return `Simone Salerno • ${data.global.title}`;
	});

	// Dynamic locale for meta tags
	let currentLocale = $derived(page.params.page || 'it');

	// OG images are pre-generated at build time as static PNGs in static/og/
	// (see scripts/generate-og-images.ts). Here we just resolve the deterministic
	// filename for the current page, riusando sectionOf per la sezione.
	let ogImageUrl = $derived.by(() => {
		const baseUrl = page.url.origin;
		const lang = page.params.page || 'it';
		const currentRoute = page.route.id;

		const file = (() => {
			if (isPageError) return 'home';
			switch (currentRoute) {
				case '/[page=lang]':
					return 'home';
				case '/[page=lang]/[route=route]': {
					const section = sectionOf(page.params.route, lang, data.navigation);
					return section ? `listing-${section}-${lang}` : 'home';
				}
				case '/[page=lang]/[route=route]/[sub]': {
					const section = sectionOf(page.params.route, lang, data.navigation);
					const id = page.data?.content?.meta?.id;
					return section && id ? `detail-${section}-${id}-${lang}` : 'home';
				}
				default:
					return 'home';
			}
		})();

		return `${baseUrl}/og/${file}.png?v=${__BUILD_TIMESTAMP__}`;
	});

	// URL canonico e link alternate hreflang per ogni lingua (+ x-default)
	let canonicalUrl = $derived(buildCanonical(page.url.origin, page.url.pathname));
	let alternateLinks = $derived(
		buildAlternates({
			origin: page.url.origin,
			pathname: page.url.pathname,
			navigation: data.navigation,
			slugMap: data.slugMap,
			languages: data.languages
		})
	);

	// Testo skip-link localizzato
	let skipLabel = $derived(currentLocale === 'en' ? 'Skip to content' : 'Salta al contenuto');

	// JSON-LD: WebSite + Person in home, BlogPosting/CreativeWork sui dettagli
	let jsonLd = $derived.by(() => {
		if (isPageError) return null;
		const origin = page.url.origin;
		const lang = currentLocale;
		const currentRoute = page.route.id;

		if (currentRoute === '/[page=lang]/[route=route]/[sub]') {
			const pageData = page.data;
			const content = pageData?.content;
			const translation = content?.translations?.[lang];
			if (!content || !translation) return null;

			if (pageData.type === 'article') {
				return [
					blogPostingJsonLd({
						canonical: canonicalUrl,
						title: translation.title,
						description: translation.meta_description || translation.excerpt || '',
						image: ogImageUrl,
						datePublished: content.meta.published_date,
						dateModified: content.meta.updated_date || content.meta.published_date,
						lang
					})
				];
			}

			if (pageData.type === 'project') {
				return [
					creativeWorkJsonLd({
						canonical: canonicalUrl,
						title: translation.title,
						description: translation.excerpt || '',
						image: ogImageUrl,
						dateCreated: content.meta.created_date,
						dateModified: content.meta.updated_date || content.meta.created_date,
						lang
					})
				];
			}
		}

		if (currentRoute === '/[page=lang]') {
			return [
				websiteJsonLd({ origin, lang, description: data.global?.description || '' }),
				personJsonLd({ origin, sameAs: socialLinks(data.contact?.links) })
			];
		}

		return null;
	});

	let jsonLdHtml = $derived(jsonLd ? serializeJsonLd(jsonLd) : null);
</script>

<svelte:head>
	<meta name="description" content={data.global?.description || ''} />
	<meta name="keywords" content={data.global?.keywords?.join(', ') || ''} />
	<meta name="author" content="Simone Salerno" />
	<title>{pageTitle}</title>

	<!-- Canonical + alternate hreflang -->
	<link rel="canonical" href={canonicalUrl} />
	{#each alternateLinks as alt (alt.hreflang)}
		<link rel="alternate" hreflang={alt.hreflang} href={alt.href} />
	{/each}

	<!-- RSS feed (lingua corrente) -->
	<link
		rel="alternate"
		type="application/rss+xml"
		title="Simone Salerno - RSS"
		href={`${page.url.origin}/${currentLocale}/rss.xml`}
	/>

	<!-- Open Graph / Facebook -->
	<meta property="og:type" content="website" />
	<meta property="og:title" content={pageTitle} />
	<meta property="og:description" content={data.global?.description || ''} />
	<meta property="og:image" content={ogImageUrl} />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta property="og:image:alt" content="Simone Salerno" />
	<meta property="og:logo" content="/logo/logo.png" />
	<meta property="og:url" content={page.url.href} />
	<meta property="og:locale" content={currentLocale === 'en' ? 'en_US' : 'it_IT'} />
	<meta property="og:site_name" content="Simone Salerno" />

	<!-- Twitter -->
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={pageTitle} />
	<meta name="twitter:description" content={data.global?.description || ''} />
	<meta name="twitter:image" content={ogImageUrl} />
	<meta name="twitter:image:alt" content="Simone Salerno" />
	<meta name="twitter:url" content={page.url.href} />
	<meta name="twitter:site" content="@essesdev" />

	<!-- Structured data (JSON-LD). L'escape di "</script>" è richiesto dal parser
	     Svelte; no-useless-escape è un falso positivo qui. -->
	{#if jsonLdHtml}
		<!-- eslint-disable-next-line no-useless-escape -->
		{@html `<script type="application/ld+json">${jsonLdHtml}<\/script>`}
	{/if}
</svelte:head>

<a href="#main-content" class="skip-link">{skipLabel}</a>

<div
	class="mx-auto flex min-h-screen w-full max-w-[90vw] flex-col overflow-x-hidden scroll-smooth text-white antialiased selection:bg-white/10"
>
	<!-- Passa dati come props ai componenti -->
	<Navbar {data} bind:menuOpen isFloatingNavVisible={scrollY > 350} />

	{#if isLanguageCodeValid}
		<FloatingNav {data} bind:menuOpen {scrollY} />
	{/if}

	<main id="main-content" class="flex-1">
		{@render children()}
	</main>

	<Footer {data} />

	{#if scrollY > 350 && !menuOpen}
		<BackToTop global={data.global} />
	{/if}
</div>
