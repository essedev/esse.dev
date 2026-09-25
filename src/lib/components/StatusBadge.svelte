<script lang="ts">
	import type { GlobalContent } from '$lib/types';
	import { getTranslation } from '$lib/utils/translations';

	type Status = 'completed' | 'in-progress' | 'idea' | 'archived';

	// Badge di stato del progetto. Unica fonte di stile + etichetta, condivisa da
	// card (listing) e pagina di dettaglio. `class` permette al chiamante di
	// posizionarlo. Stile "riga di sistema": LED nel colore dello stato + label mono
	// uppercase neutra. 'idea' usa l'accento del brand.
	let {
		status,
		global,
		class: className = ''
	}: { status: Status; global: GlobalContent | null | undefined; class?: string } = $props();

	const STATUS_STYLE: Record<Status, string> = {
		completed: 'text-emerald-300',
		'in-progress': 'text-amber-300',
		idea: 'text-accent',
		archived: 'text-gray-400'
	};
	const STATUS_KEY = {
		completed: 'statusCompleted',
		'in-progress': 'statusInProgress',
		idea: 'statusIdea',
		archived: 'statusArchived'
	} as const;

	let label = $derived(getTranslation(global, STATUS_KEY[status]));
</script>

<!-- LED colorato, etichetta neutra: il colore dice lo stato, il testo resta nella
     scala di grigi come ogni altra etichetta. -->
<span class="label inline-flex items-center gap-2 text-gray-300 {className}">
	<span
		class="h-[7px] w-[7px] rounded-[1px] bg-current shadow-[0_0_6px_currentColor] {STATUS_STYLE[
			status
		]}"
	></span>
	{label}
</span>
