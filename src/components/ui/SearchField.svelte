<script lang="ts">
	import { Search, X } from '@lucide/svelte';

	let {
		value = $bindable(''),
		label,
		clearLabel
	}: { value?: string; label: string; clearLabel: string } = $props();

	let input: HTMLInputElement;
</script>

<div class="relative flex-1 sm:min-w-64">
	<Search class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subtle" />
	<input
		bind:this={input}
		bind:value
		type="search"
		aria-label={label}
		placeholder={label}
		autocomplete="off"
		spellcheck="false"
		onkeydown={(e) => {
			if (e.key === 'Escape' && value) {
				e.preventDefault();
				value = '';
			}
		}}
		class="h-10 w-full appearance-none rounded-md border border-line bg-surface pr-9 pl-9 text-sm transition-colors placeholder:text-subtle hover:border-subtle focus-visible:border-subtle [&::-webkit-search-cancel-button]:hidden"
	/>
	{#if value}
		<button
			type="button"
			aria-label={clearLabel}
			class="absolute top-1/2 right-2 flex size-6 -translate-y-1/2 items-center justify-center rounded text-subtle transition-colors hover:text-fg"
			onclick={() => {
				value = '';
				input.focus();
			}}
		>
			<X class="size-4" />
		</button>
	{/if}
</div>
