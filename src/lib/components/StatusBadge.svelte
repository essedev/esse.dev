<script lang="ts">
	import type { GlobalContent } from '$lib/types';
	import { getTranslation } from '$lib/utils/translations';

	type Status = 'completed' | 'in-progress' | 'idea' | 'archived';

	// Badge di stato del progetto. Unica fonte di stile + etichetta, condivisa da
	// card (listing) e pagina di dettaglio. `class` permette al chiamante di
	// posizionarlo (es. absolute sulla cover della card, self-start nell'header).
	let {
		status,
		global,
		class: className = ''
	}: { status: Status; global: GlobalContent | null | undefined; class?: string } = $props();

	// Colori del badge (coerenti col tema scuro/glassy).
	const STATUS_STYLE: Record<Status, string> = {
		completed: 'bg-emerald-500/15 text-emerald-200 border-emerald-400/25',
		'in-progress': 'bg-amber-500/15 text-amber-200 border-amber-400/25',
		idea: 'bg-violet-500/15 text-violet-200 border-violet-400/25',
		archived: 'bg-white/10 text-gray-300 border-white/15'
	};
	// Status -> chiave di traduzione per l'etichetta.
	const STATUS_KEY = {
		completed: 'statusCompleted',
		'in-progress': 'statusInProgress',
		idea: 'statusIdea',
		archived: 'statusArchived'
	} as const;

	let label = $derived(getTranslation(global, STATUS_KEY[status]));
</script>

<span
	class="rounded-full border px-2.5 py-1 text-xs font-medium backdrop-blur-md {STATUS_STYLE[
		status
	]} {className}"
>
	{label}
</span>
