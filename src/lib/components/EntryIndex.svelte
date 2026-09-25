<script lang="ts" module>
	export interface IndexEntry {
		key: string;
		/** Path senza base: il componente la antepone. */
		href: string;
		meta: string;
		title: string;
		excerpt: string;
		tags?: string[];
	}
</script>

<script lang="ts">
	import { base } from '$app/paths';
	import { reveal } from '$lib/actions/reveal';
	import { ArrowRight } from '@lucide/svelte';

	// Indice a pannello: una riga per voce (dato, titolo e una frase, stack) dentro un
	// pannello dello stesso materiale delle card (bordo, fondo, raggio). È la densità bassa
	// del sito, per lo scaffale dei progetti e per il blog: legge come la tabella di uno
	// strumento invece che come testo sciolto accanto a oggetti.
	let {
		entries,
		label,
		wideMeta = false
	}: {
		entries: IndexEntry[];
		/** Intestazione del pannello, con il conteggio a destra. Assente se la sezione ha già un header. */
		label?: string;
		/** Colonna del dato più larga, per una data completa invece del solo anno. */
		wideMeta?: boolean;
	} = $props();

	let count = $derived(String(entries.length).padStart(2, '0'));
</script>

<div use:reveal class="reveal panel overflow-hidden">
	{#if label}
		<div
			class="label flex items-center gap-x-4 border-b border-line-2 px-4 py-3.5 text-gray-500 sm:px-5"
		>
			<span class="text-gray-300">{label}</span>
			<span class="flex-1"></span>
			<span class="tabular-nums">{count}</span>
		</div>
	{/if}
	<ul>
		{#each entries as entry (entry.key)}
			<li class="border-b border-line-1 last:border-b-0">
				<!-- Una griglia sola a tutte le larghezze. Sotto md la riga è titolo + anno a
				     destra (o data sopra il titolo, se il dato è lungo) e una frase sotto; da md
				     il dato prende la prima colonna e a destra compaiono stack e freccia. Niente
				     colonna vuota da 3rem su un telefono. -->
				<a
					href={`${base}${entry.href}`}
					class="group grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-4 gap-y-1 px-4 py-3.5 transition-colors duration-200 hover:bg-surface-2 sm:px-5 sm:py-4 md:gap-x-6 {wideMeta
						? 'md:grid-cols-[7rem_minmax(0,1fr)_minmax(0,15rem)_1.5rem]'
						: 'md:grid-cols-[4.5rem_minmax(0,1fr)_minmax(0,15rem)_1.5rem]'}"
				>
					<span
						class="font-mono text-xs whitespace-nowrap text-gray-500 uppercase tabular-nums md:col-start-1 md:row-start-1 {wideMeta
							? 'col-span-2 row-start-1 md:col-span-1'
							: 'col-start-2 row-start-1'}"
					>
						{entry.meta}
					</span>
					<span
						class="col-start-1 min-w-0 text-base font-medium text-gray-100 transition-colors group-hover:text-white sm:text-lg md:col-start-2 md:row-start-1 {wideMeta
							? 'col-span-2 row-start-2 md:col-span-1'
							: 'row-start-1'}"
					>
						{entry.title}
					</span>
					<span
						class="col-span-2 line-clamp-2 text-sm leading-relaxed text-gray-500 md:col-span-1 md:col-start-2 md:row-start-2 {wideMeta
							? 'row-start-3'
							: 'row-start-2'}"
					>
						{entry.excerpt}
					</span>
					<!-- Stack come chip, le stesse delle card: due al massimo, su una riga, si
					     stringono con l'ellissi. -->
					<span
						class="hidden min-w-0 justify-end gap-1.5 md:col-start-3 md:row-start-1 md:flex"
						title={(entry.tags ?? []).join(' · ')}
					>
						{#each (entry.tags ?? []).slice(0, 2) as tag (tag)}
							<span class="chip">{tag}</span>
						{/each}
					</span>
					<span
						class="hidden text-gray-600 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-accent md:col-start-4 md:row-start-1 md:flex md:justify-end md:self-center"
						aria-hidden="true"
					>
						<ArrowRight class="h-3.5 w-3.5" />
					</span>
				</a>
			</li>
		{/each}
	</ul>
</div>
