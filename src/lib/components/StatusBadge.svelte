<script lang="ts">
	import type { GlobalContent } from '$lib/types';
	import { getTranslation } from '$lib/utils/translations';

	type Status = 'completed' | 'in-progress' | 'idea' | 'archived';

	// Badge di stato del progetto. Unica fonte di stile + etichetta, condivisa da
	// card (listing) e pagina di dettaglio. `class` permette al chiamante di
	// posizionarlo. Stile "riga di sistema": dot + label mono uppercase nel colore
	// dello stato. 'idea'/Esplorazione usa l'accento azzurro del brand.
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

<span class="label inline-flex items-center gap-1.5 {STATUS_STYLE[status]} {className}">
	<span class="h-[7px] w-[7px] rounded-[1px] bg-current"></span>
	{label}
</span>
