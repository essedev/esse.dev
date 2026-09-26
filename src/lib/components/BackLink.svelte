<script lang="ts">
	import { afterNavigate } from '$app/navigation';
	import { ChevronLeft } from '@lucide/svelte';

	// Link "Indietro" contestuale. Se si arriva al dettaglio da una pagina interna
	// del sito (home, listing, tag, related...), "Indietro" ripercorre la history e
	// torna esattamente da dove si viene. Se invece si atterra diretto sul dettaglio
	// (link condiviso, nuova tab, reload) non c'e history interna su cui tornare: si
	// segue l'`href` di fallback (la listing). Restando un vero <a href>, funziona
	// anche senza JS ed e accessibile.
	let { href, label }: { href: string; label: string } = $props();

	let cameFromInternal = $state(false);
	afterNavigate((nav) => {
		if (nav.type !== 'enter' && nav.from) cameFromInternal = true;
	});

	function handleClick(event: MouseEvent) {
		// Lascia passare apertura in nuova tab / click non primario.
		if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) {
			return;
		}
		if (!cameFromInternal) return; // segue l'href di fallback
		event.preventDefault();
		history.back();
	}
</script>

<a {href} onclick={handleClick} class="flex items-center gap-x-[0.15rem]">
	<ChevronLeft class="h-6 w-6 text-gray-100" style="margin-bottom: -0.1rem;" />
	<span class="hover:underline">{label}</span>
</a>
