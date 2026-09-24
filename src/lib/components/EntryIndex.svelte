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
		<div class="label flex items-center gap-x-4 border-b border-line-2 px-5 py-3.5 text-gray-500">
			<span class="text-gray-300">{label}</span>
			<span class="flex-1"></span>
			<span class="tabular-nums">{count}</span>
		</div>
	{/if}
	<ul>
		{#each entries as entry (entry.key)}
			<li class="border-b border-line-1 last:border-b-0">
				<a
					href={`${base}${entry.href}`}
					class="group grid items-baseline gap-x-4 px-5 py-4 transition-colors duration-200 hover:bg-surface-2 sm:gap-x-6 {wideMeta
						? 'grid-cols-[5.5rem_1fr] md:grid-cols-[7rem_1fr_minmax(0,15rem)_1.5rem]'
						: 'grid-cols-[3rem_1fr] md:grid-cols-[4.5rem_1fr_minmax(0,15rem)_1.5rem]'}"
				>
					<span class="font-mono text-xs text-gray-500 uppercase tabular-nums">{entry.meta}</span>
					<span class="flex min-w-0 flex-col gap-y-1">
						<span
							class="text-base text-gray-200 transition-colors group-hover:text-white sm:text-lg"
						>
							{entry.title}
						</span>
						<span class="text-sm leading-relaxed text-gray-500">{entry.excerpt}</span>
					</span>
					<!-- Stack su una riga sola, troncata: i tag tradotti possono essere lunghi e un
					     pannello che va a capo per un'etichetta perde il ritmo della tabella. -->
					<span
						class="label hidden truncate text-right text-gray-500 md:block"
						title={(entry.tags ?? []).join(' · ')}
					>
						{(entry.tags ?? []).slice(0, 2).join(' · ')}
					</span>
					<span
						class="hidden text-right font-mono text-sm text-gray-600 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-accent md:block"
						aria-hidden="true">&rarr;</span
					>
				</a>
			</li>
		{/each}
	</ul>
</div>
