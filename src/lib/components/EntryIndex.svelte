<script lang="ts" module>
	export interface IndexEntry {
		key: string;
		/** Path senza base: il componente la antepone. */
		href: string;
		meta: string;
		title: string;
		excerpt: string;
	}
</script>

<script lang="ts">
	import { base } from '$app/paths';
	import { reveal } from '$lib/actions/reveal';

	// Indice tipografico: una riga per voce (dato a sinistra, titolo, una frase). È la
	// densità bassa del sito: lo scaffale dei progetti (archivio, idee) e il blog. Niente
	// immagine né badge; se c'è un'etichetta, lo stato lo dice lei.

	let {
		entries,
		label,
		wideMeta = false
	}: {
		entries: IndexEntry[];
		/** Titoletto del gruppo, con il conteggio a destra. Assente se la sezione ha già un header. */
		label?: string;
		/** Colonna del dato più larga, per una data completa invece del solo anno. */
		wideMeta?: boolean;
	} = $props();

	let count = $derived(String(entries.length).padStart(2, '0'));
</script>

<div use:reveal class="reveal flex flex-col">
	{#if label}
		<div
			class="flex items-center gap-x-4 border-b border-white/10 pb-3 font-mono text-[0.65rem] tracking-[0.18em] text-gray-500 uppercase sm:text-xs"
		>
			<span class="text-gray-300">{label}</span>
			<span class="h-px flex-1 bg-white/5"></span>
			<span class="tabular-nums">{count}</span>
		</div>
	{/if}
	<ul class={label ? '' : 'border-t border-white/10'}>
		{#each entries as entry (entry.key)}
			<li>
				<a
					href={`${base}${entry.href}`}
					class="group grid items-baseline gap-x-4 border-b border-white/5 py-5 transition-colors sm:gap-x-6 {wideMeta
						? 'grid-cols-1 gap-y-2 sm:grid-cols-[8rem_1fr_auto]'
						: 'grid-cols-[3rem_1fr] sm:grid-cols-[4rem_1fr_auto]'}"
				>
					<span class="font-mono text-xs text-gray-500 uppercase tabular-nums">{entry.meta}</span>
					<span class="flex flex-col gap-y-1.5">
						<span class="text-lg text-gray-200 transition-colors group-hover:text-white sm:text-xl">
							{entry.title}
						</span>
						<span class="text-sm leading-relaxed text-gray-500">{entry.excerpt}</span>
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
