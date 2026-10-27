<script lang="ts">
	/**
	 * The call and the result of an open token, under its row: the transparency a token keeps
	 * one click away (concept Q, D2).
	 */
	let {
		name,
		call,
		result,
		labels
	}: {
		name: string;
		/** The call, already as text (`callText`). */
		call: string;
		/** The result's text, once it came back. */
		result?: string;
		labels: { call: string; result: string };
	} = $props();
</script>

<div
	class="flex flex-col gap-2 rounded-[var(--radius-control)] bg-surface/60 px-3 py-2.5 font-mono text-xs"
	data-agent-step-detail
>
	<p class="flex items-center gap-2">
		<span class="text-fg">{name}</span>
		<span class="label">{labels.call}</span>
	</p>
	<pre class="overflow-x-auto overscroll-x-none whitespace-pre-wrap text-muted">{call}</pre>
	{#if result !== undefined}
		<p class="label">{labels.result}</p>
		<pre
			class="max-h-64 overflow-auto overscroll-x-none whitespace-pre-wrap text-muted">{result}</pre>
	{/if}
</div>
