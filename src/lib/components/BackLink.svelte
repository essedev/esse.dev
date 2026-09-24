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

<a {href} onclick={handleClick} class="key key--ghost self-start py-2 pr-4 pl-2.5">
	<ChevronLeft class="h-4 w-4" />
	<span>{label}</span>
</a>
