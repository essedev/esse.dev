<script lang="ts">
	import { base } from '$app/paths';
	import { reveal } from '$lib/actions/reveal';
	import type { ProjectItem } from '$lib/types';

	// Indice tipografico: una riga per progetto (anno, titolo, una frase). È la densità
	// dello scaffale, per archiviati e idee: niente immagine, niente badge, lo stato lo
	// dice l'etichetta del gruppo.
	let {
		label,
		projects,
		selectedLanguage,
		projectsRoute
	}: {
		label: string;
		projects: ProjectItem[];
		selectedLanguage: string;
		projectsRoute: string;
	} = $props();

	let count = $derived(String(projects.length).padStart(2, '0'));
</script>

<div use:reveal class="reveal flex flex-col">
	<div
		class="flex items-center gap-x-4 border-b border-white/10 pb-3 font-mono text-[0.65rem] tracking-[0.18em] text-gray-500 uppercase sm:text-xs"
	>
		<span class="text-gray-300">{label}</span>
		<span class="h-px flex-1 bg-white/5"></span>
		<span class="tabular-nums">{count}</span>
	</div>
	<ul>
		{#each projects as project (project.meta.id)}
			{@const t = project.translations[selectedLanguage]}
			<li>
				<a
					href={`${base}/${selectedLanguage}/${projectsRoute}/${t.slug}`}
					class="group grid grid-cols-[3rem_1fr] items-baseline gap-x-4 border-b border-white/5 py-5 transition-colors sm:grid-cols-[4rem_1fr_auto] sm:gap-x-6"
				>
					<span class="font-mono text-xs text-gray-500 tabular-nums">
						{project.meta.created_date.slice(0, 4)}
					</span>
					<span class="flex flex-col gap-y-1.5">
						<span class="text-lg text-gray-200 transition-colors group-hover:text-white sm:text-xl">
							{t.title}
						</span>
						<span class="text-sm leading-relaxed text-gray-500">{t.excerpt}</span>
					</span>
					<span
						class="hidden font-mono text-sm text-gray-600 transition-all duration-300 group-hover:translate-x-1 group-hover:text-accent sm:block"
						aria-hidden="true">&rarr;</span
					>
				</a>
			</li>
		{/each}
	</ul>
</div>
