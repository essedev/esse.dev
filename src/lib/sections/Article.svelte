<script lang="ts">
	import { base } from '$app/paths';
	import ArticleCard from '$lib/components/ArticleCard.svelte';
	import BackLink from '$lib/components/BackLink.svelte';
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
		<!-- Stesso impianto del dettaglio progetto: titolo e sommario a tutta larghezza, poi
		     da lg due colonne con la scheda (data, lettura, tag) ferma a sinistra e il corpo
		     su una misura di lettura a destra. Niente immagine hero finché non esistono
		     immagini vere. -->
		<article class="flex flex-col gap-y-10 lg:gap-y-14">
			<header use:reveal={{ delay: 60 }} class="reveal flex flex-col gap-y-5">
				<h1
					class="font-mono text-4xl leading-[1.05] font-medium tracking-tight sm:text-5xl 2xl:text-6xl"
				>
					{currentTranslation.title}
				</h1>
				{#if currentTranslation.excerpt}
					<p class="text-xl leading-snug text-gray-300 sm:text-2xl">
						{currentTranslation.excerpt}
					</p>
				{/if}
			</header>

			<div
				class="grid gap-y-10 lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-x-16 xl:grid-cols-[18rem_minmax(0,1fr)] 2xl:grid-cols-[22rem_minmax(0,1fr)] 2xl:gap-x-24"
			>
				<aside
					use:reveal={{ delay: 100 }}
					class="reveal flex flex-col gap-y-6 self-start lg:sticky lg:top-[calc(var(--chassis-gutter)+var(--chassis-nav-h)+2rem)]"
				>
					<div class="flex flex-col gap-y-2">
						<span class="label text-gray-600"
							>{currentLang === 'en' ? 'Published' : 'Pubblicato'}</span
						>
						<time datetime={content.meta.published_date} class="font-mono text-sm text-gray-300">
							{formatDate(content.meta.published_date, currentLang)}
						</time>
					</div>
					{#if metrics.minutes > 0}
						<div class="flex flex-col gap-y-2">
							<span class="label text-gray-600">{currentLang === 'en' ? 'Reading' : 'Lettura'}</span
							>
							<span class="font-mono text-sm text-gray-300">
								{metrics.minutes} min
								<span
									class="text-gray-500"
									title={currentLang === 'en'
										? 'Estimated LLM context size'
										: 'Contesto LLM stimato'}
								>
									· ~{metrics.tokensLabel} token
								</span>
							</span>
						</div>
					{/if}
					{#if tagLinks.length > 0}
						<div class="flex flex-col gap-y-2">
							<span class="label text-gray-600">Tag</span>
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
						</div>
					{/if}
				</aside>

				{#if currentTranslation.content}
					<div use:reveal={{ delay: 150 }} class="reveal min-w-0">
						<ContentRenderer content={currentTranslation.content} />
					</div>
				{/if}
			</div>
		</article>

		{#if related && related.length > 0}
			<section class="mt-12 border-t border-line-2 pt-10">
				<h2 use:reveal class="reveal mb-6 font-mono text-2xl font-medium text-gray-100">
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
