<script lang="ts">
	import { base } from '$app/paths';
	import BackLink from '$lib/components/BackLink.svelte';
	import StatusBadge from '$lib/components/StatusBadge.svelte';
	import ContentRenderer from '$lib/components/ui/ContentRenderer.svelte';
	import type { ProjectSectionProps } from '$lib/types';
	import { getTranslation, translateTags } from '$lib/utils/translations';
	import { ExternalLink } from '@lucide/svelte';
	import { reveal } from '$lib/actions/reveal';

	// Receive props from parent
	let { content, currentLang, global, navigation }: ProjectSectionProps = $props();

	let backText = $derived(getTranslation(global, 'back'));
	// Etichette della scheda tecnica: non passano dal JSON globale perché sono parole di
	// interfaccia fisse, non contenuto.
	let t = $derived(
		currentLang === 'en'
			? { status: 'Status', year: 'Year', repo: 'Repository', stack: 'Stack' }
			: { status: 'Stato', year: 'Anno', repo: 'Repository', stack: 'Stack' }
	);

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
		<!-- Titolo e sommario a tutta larghezza; sotto, da lg, due colonne: a sinistra la
		     scheda tecnica (stato, repo, stack) che resta ferma scorrendo, a destra il corpo
		     su una misura di lettura. Lo schermo si usa tutto senza righe da 130 caratteri.
		     Niente immagine hero finché non esistono immagini vere. -->
		<article class="flex flex-col gap-y-10 lg:gap-y-14">
			<header use:reveal={{ delay: 60 }} class="reveal flex flex-col gap-y-5">
				<h2
					class="font-mono text-4xl leading-[1.05] font-medium tracking-tight sm:text-5xl 2xl:text-6xl"
				>
					{currentTranslation.title}
				</h2>
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
					{#if content.meta.status}
						<div class="flex flex-col gap-y-2">
							<span class="label text-gray-600">{t.status}</span>
							<StatusBadge status={content.meta.status} {global} class="self-start" />
						</div>
					{/if}
					{#if content.meta.created_date}
						<div class="flex flex-col gap-y-2">
							<span class="label text-gray-600">{t.year}</span>
							<span class="font-mono text-sm text-gray-300 tabular-nums">
								{content.meta.created_date.slice(0, 4)}
							</span>
						</div>
					{/if}
					{#if content.meta.link}
						<div class="flex flex-col gap-y-2">
							<span class="label text-gray-600">{t.repo}</span>
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
						</div>
					{/if}
					{#if tagLinks.length > 0}
						<div class="flex flex-col gap-y-2">
							<span class="label text-gray-600">{t.stack}</span>
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
						</div>
					{/if}
				</aside>

				{#if currentTranslation.content}
					<div use:reveal={{ delay: 150 }} class="reveal min-w-0">
						<ContentRenderer
							content={currentTranslation.content}
							className="flex flex-col gap-y-4"
						/>
					</div>
				{/if}
			</div>
		</article>
	{/if}
</div>
