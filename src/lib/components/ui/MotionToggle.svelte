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
	role="switch"
	aria-checked={enabled}
	aria-label={label}
	class="group key key--sm"
>
	<span>{label}</span>
	<!-- Switch "meccanico" squadrato: track carbone, thumb pieno che scatta a
	     destra e si accende in azzurro (mini glow CRT) quando le animazioni sono on. -->
	<span
		class="relative inline-flex h-4 w-7 items-center rounded-[4px] border px-[2px] transition-colors duration-200 {enabled
			? 'border-accent/50 bg-accent/20'
			: 'border-line-2 bg-surface-2'}"
	>
		<span
			class="motion-thumb h-2.5 w-2.5 rounded-[2px] transition-all duration-300 ease-[cubic-bezier(0.34,1.45,0.6,1)] {enabled
				? 'translate-x-[0.7rem] bg-accent shadow-[0_0_6px] shadow-accent/70'
				: 'translate-x-0 bg-gray-500'}"
		></span>
	</span>
</button>
