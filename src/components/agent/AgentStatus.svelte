<script lang="ts">
	/**
	 * The status line under the answer in progress (concept G, B): the phase, which on every
	 * change decodes from block glyphs into the word, and its numbers. Screen readers get the
	 * phase alone, once per change; the numbers tick every 100 ms and stay out.
	 */
	let {
		label,
		meta = '',
		inset = true
	}: {
		label: string;
		meta?: string;
		/** Indented like the answers; off where the line stands above the empty state. */
		inset?: boolean;
	} = $props();

	const GLYPHS = '▖▗▘▝▚▞▙▛▜▟█▓▒░<>/\\|=+*#';
	const DECODE_MS = 350;
	const FRAME_MS = 30;

	let text = $state('');
	$effect(() => {
		const target = label;
		if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
			text = target;
			return;
		}
		const start = performance.now();
		const frame = () => {
			const progress = Math.min(1, (performance.now() - start) / DECODE_MS);
			const fixed = Math.floor(target.length * progress);
			text =
				target.slice(0, fixed) +
				Array.from(target.slice(fixed), (c) =>
					c === ' ' ? ' ' : GLYPHS[Math.floor(Math.random() * GLYPHS.length)]
				).join('');
			if (progress === 1) clearInterval(timer);
		};
		const timer = setInterval(frame, FRAME_MS);
		frame();
		return () => clearInterval(timer);
	});
</script>

<p
	class={['flex items-center gap-2.5 font-mono text-xs text-subtle', inset && 'pl-6']}
	data-agent-status
>
	<span class="text-text" aria-hidden="true">{text}</span>
	<span class="sr-only" role="status">{label}</span>
	{#if meta}<span class="tabular-nums" aria-hidden="true">· {meta}</span>{/if}
</p>
