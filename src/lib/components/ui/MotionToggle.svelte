<script lang="ts">
	import { browser } from '$app/environment';

	let { lang = 'it' }: { lang?: string } = $props();

	// 'full' = animazioni attive, 'reduced' = ridotte. Senza scelta salvata si segue
	// la preferenza di sistema (prefers-reduced-motion).
	let enabled = $state(true);

	$effect(() => {
		if (!browser) return;
		const stored = localStorage.getItem('motion'); // 'full' | 'reduced' | null
		const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		enabled = (stored ?? (prefersReduced ? 'reduced' : 'full')) === 'full';
		// Applica la scelta esplicita su <html> (se assente, resta il default OS).
		if (stored) document.documentElement.dataset.motion = stored;
	});

	function toggle() {
		enabled = !enabled;
		const value = enabled ? 'full' : 'reduced';
		localStorage.setItem('motion', value);
		document.documentElement.dataset.motion = value;
	}

	let label = $derived(lang === 'en' ? 'Animations' : 'Animazioni');
</script>

<button
	type="button"
	onclick={toggle}
	aria-pressed={enabled}
	class="cursor-pointer transition-colors hover:text-white"
>
	{label}: {enabled ? 'on' : 'off'}
</button>
