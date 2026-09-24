<script lang="ts">
	import { base } from '$app/paths';
	import ArticleCard from '$lib/components/ArticleCard.svelte';
	import BackLink from '$lib/components/BackLink.svelte';
	import OptimizedImage from '$lib/components/OptimizedImage.svelte';
	import ContentRenderer from '$lib/components/ui/ContentRenderer.svelte';
	import type { ArticleSectionProps } from '$lib/types';
	import { getTranslation, translateTags } from '$lib/utils/translations';
	import { contentMetrics } from '$lib/utils/content-metrics';
	import { reveal } from '$lib/actions/reveal';

	// Receive props from parent
	let { content, currentLang, global, related, navigation }: ArticleSectionProps = $props();

	let blogRoute = $derived(navigation?.[currentLang]?.articles ?? 'blog');

	// Get translation with type safety
	let backText = $derived(getTranslation(global, 'back'));

	// Fallback per "Indietro" quando si atterra diretto sul dettaglio: la listing.
	let blogUrl = $derived(`${base}/${currentLang}/${blogRoute}`);
	let currentTranslation = $derived(content.translations[currentLang]);
	// Coppie {raw, label}: il link usa il tag grezzo (il filtro confronta i raw),
	// l'etichetta mostra il tag tradotto.
	let tagLinks = $derived(
		(currentTranslation?.tags ?? []).map((raw) => ({
			raw,
			label: translateTags(global, [raw])[0] ?? raw
		}))
	);
	let metrics = $derived(contentMetrics(currentTranslation?.content, currentLang));

	// Stagger d'ingresso delle card correlate (come le listing).
	const cardStagger = (i: number) => Math.min(i, 4) * 60;

	function formatDate(dateString: string, lang: string): string {
		const date = new Date(dateString);
		const options: Intl.DateTimeFormatOptions = {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		};
		return date.toLocaleDateString(lang === 'it' ? 'it-IT' : 'en-US', options);
	}
</script>

<div>
	<div use:reveal class="reveal flex pb-10 text-2xl 2xl:pb-14">
		<BackLink href={blogUrl} label={backText} />
	</div>

	{#if content && currentTranslation}
		<article class="flex flex-col gap-y-8">
			<!-- Header with title and meta -->
			<header use:reveal={{ delay: 60 }} class="reveal flex flex-col gap-y-4">
				<h1 class="text-5xl font-normal sm:text-6xl 2xl:text-7xl">
					{currentTranslation.title}
				</h1>

				<div class="flex flex-col gap-y-2 text-xl text-gray-400">
					<div class="flex flex-wrap items-center gap-x-2">
						<time datetime={content.meta.published_date}>
							{formatDate(content.meta.published_date, currentLang)}
						</time>
						{#if metrics.minutes > 0}
							<span aria-hidden="true" class="text-gray-600">·</span>
							<span>{metrics.minutes} min {currentLang === 'en' ? 'read' : 'di lettura'}</span>
							<span aria-hidden="true" class="text-gray-600">·</span>
							<span
								title={currentLang === 'en' ? 'Estimated LLM context size' : 'Contesto LLM stimato'}
							>
								~{metrics.tokensLabel} token
							</span>
						{/if}
					</div>

					{#if currentTranslation.excerpt}
						<p class="text-2xl text-gray-300 italic">
							{currentTranslation.excerpt}
						</p>
					{/if}
				</div>

				{#if tagLinks.length > 0}
					<div class="flex flex-wrap gap-1.5">
						{#each tagLinks as tag (tag.raw)}
							<a
								href={`${base}/${currentLang}/${blogRoute}?tags=${encodeURIComponent(tag.raw)}`}
								class="chip"
							>
								{tag.label}
							</a>
						{/each}
					</div>
				{/if}
			</header>

			<!-- Featured image if available -->
			{#if content.meta.featured_image || content.meta.featuredImagePlaceholder}
				<div use:reveal={{ delay: 110 }} class="reveal w-full">
					<OptimizedImage
						src={content.meta.featured_image}
						alt={currentTranslation.title}
						className="panel aspect-video"
						showPlaceholder={Boolean(content.meta.featuredImagePlaceholder)}
						sizes="100vw"
					/>
				</div>
			{/if}

			<!-- Content -->
			{#if currentTranslation.content}
				<div use:reveal={{ delay: 150 }} class="reveal">
					<ContentRenderer content={currentTranslation.content} className="max-w-none" />
				</div>
			{/if}
		</article>

		{#if related && related.length > 0}
			<section class="mt-12 border-t border-line-2 pt-10">
				<h2 use:reveal class="reveal mb-6 text-3xl font-normal text-gray-100">
					{currentLang === 'en' ? 'Related articles' : 'Articoli correlati'}
				</h2>
				<div class="grid grid-cols-1 gap-6 sm:gap-10 md:grid-cols-2 xl:grid-cols-3">
					{#each related as item, i (item.meta.id)}
						{@const t = item.translations[currentLang]}
						{#if t}
							<div
								use:reveal={{ delay: cardStagger(i) }}
								class="reveal h-full [--reveal-shift:2rem]"
							>
								<ArticleCard
									title={t.title}
									excerpt={t.excerpt}
									featuredImage={item.meta.featured_image}
									featuredImagePlaceholder={item.meta.featuredImagePlaceholder}
									link={`/${currentLang}/${blogRoute}/${t.slug}`}
									publishedDate={item.meta.published_date}
									tags={translateTags(global, t.tags)}
									selectedLanguage={currentLang}
								/>
							</div>
						{/if}
					{/each}
				</div>
			</section>
		{/if}
	{/if}
</div>
