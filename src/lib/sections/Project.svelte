<script lang="ts">
	import { base } from '$app/paths';
	import BackLink from '$lib/components/BackLink.svelte';
	import OptimizedImage from '$lib/components/OptimizedImage.svelte';
	import StatusBadge from '$lib/components/StatusBadge.svelte';
	import ContentRenderer from '$lib/components/ui/ContentRenderer.svelte';
	import type { ProjectSectionProps } from '$lib/types';
	import { getTranslation, translateTags } from '$lib/utils/translations';
	import { ExternalLink } from '@lucide/svelte';
	import { reveal } from '$lib/actions/reveal';

	// Receive props from parent
	let { content, currentLang, global, navigation }: ProjectSectionProps = $props();

	// Get translation with type safety
	let backText = $derived(getTranslation(global, 'back'));

	let currentTranslation = $derived(content.translations[currentLang]);
	let projectsRoute = $derived(navigation?.[currentLang]?.projects ?? 'projects');
	// Fallback per "Indietro" quando si atterra diretto sul dettaglio: la listing.
	let projectsUrl = $derived(`${base}/${currentLang}/${projectsRoute}`);
	// Coppie {raw, label}: link sul tag grezzo (il filtro confronta i raw), testo tradotto.
	let tagLinks = $derived(
		(currentTranslation?.tags ?? []).map((raw) => ({
			raw,
			label: translateTags(global, [raw])[0] ?? raw
		}))
	);
</script>

<div>
	<div use:reveal class="reveal flex pb-10 text-2xl 2xl:pb-14">
		<BackLink href={projectsUrl} label={backText} />
	</div>

	{#if content && currentTranslation}
		<!-- Colonna di lettura: titolo, sommario, immagine e corpo stanno in 48rem, allineati a
	     sinistra come tutto il sito. Una riga da 1300px non si legge, e l'immagine 16:9 a
	     tutta larghezza era un muro. -->
		<article class="flex max-w-3xl flex-col gap-y-8">
			<header use:reveal={{ delay: 60 }} class="reveal flex flex-col gap-y-6">
				{#if content.meta.status}
					<StatusBadge status={content.meta.status} {global} class="self-start" />
				{/if}

				<h2 class="text-5xl font-normal sm:text-6xl 2xl:text-7xl">
					{currentTranslation.title}
				</h2>

				{#if currentTranslation.excerpt}
					<p class="text-xl leading-snug text-gray-300 sm:text-2xl">{currentTranslation.excerpt}</p>
				{/if}

				{#if content.meta.link}
					<a
						href={content.meta.link}
						class="key key--ghost self-start normal-case"
						target="_blank"
						rel="noopener noreferrer"
						data-sveltekit-reload
					>
						<ExternalLink class="h-4 w-4" />
						{content.meta.link.replace(/^https?:\/\//, '').replace(/\/$/, '')}
					</a>
				{/if}

				{#if tagLinks.length > 0}
					<div class="flex flex-wrap gap-1.5">
						{#each tagLinks as tag (tag.raw)}
							<a
								href={`${base}/${currentLang}/${projectsRoute}?tags=${encodeURIComponent(tag.raw)}`}
								class="chip"
							>
								{tag.label}
							</a>
						{/each}
					</div>
				{/if}
			</header>

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

			{#if currentTranslation.content}
				<div use:reveal={{ delay: 150 }} class="reveal">
					<ContentRenderer content={currentTranslation.content} className="flex flex-col gap-y-4" />
				</div>
			{/if}
		</article>
	{/if}
</div>
