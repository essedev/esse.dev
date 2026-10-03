<script lang="ts">
	import type { ChildReport } from '../../agent/delegate';
	import { renderMarkdown } from '../../agent/markdown';

	/**
	 * I sotto-agenti di `delegate`: mentre lavorano, i loro compiti (dagli argomenti); a
	 * lavoro finito, per ognuno le chiamate fatte, token, costo e la risposta, apribile.
	 */
	let {
		tasks,
		reports,
		labels,
		tokens,
		spent
	}: {
		tasks: { title: string; task: string }[];
		reports: ChildReport[] | null;
		labels: { subagents: string; answer: string };
		tokens: (n: number) => string;
		spent: (usd: number) => string;
	} = $props();
</script>

<section class="flex flex-col gap-2 rounded-[var(--radius-control)] bg-panel px-4 py-3">
	<h3 class="font-mono text-xs text-subtle">delegate · {labels.subagents}</h3>
	<ol class="flex flex-col gap-2">
		{#each tasks as task, i (i)}
			{@const report = reports?.[i]}
			<li class="flex flex-col gap-1">
				<div class="flex items-center gap-2.5 text-sm">
					<span
						class="led"
						data-status={!report ? 'in-progress' : report.error ? 'archived' : 'completed'}
					></span>
					<span class="text-fg">{task.title}</span>
					{#if report}
						<span class="ml-auto shrink-0 font-mono text-[0.7rem] text-subtle">
							{report.calls.length} tool · {tokens(report.tokens)} token · {spent(report.usd)}
						</span>
					{/if}
				</div>
				{#if report}
					{#if report.calls.length}
						<p class="truncate pl-[1.125rem] font-mono text-[0.7rem] text-subtle">
							{report.calls.map((c) => c.name).join(' → ')}
						</p>
					{/if}
					{#if report.error}
						<p class="pl-[1.125rem] font-mono text-xs text-danger">{report.error}</p>
					{:else if report.answer}
						<details class="pl-[1.125rem]">
							<summary
								class="cursor-pointer font-mono text-[0.7rem] text-subtle transition-colors hover:text-muted"
							>
								{labels.answer}
							</summary>
							<div
								class="prose mt-2 max-w-none text-sm prose-invert prose-p:my-2 prose-p:text-muted prose-a:text-fg prose-a:decoration-subtle prose-code:font-normal prose-code:text-fg prose-code:before:content-none prose-code:after:content-none prose-li:text-muted"
							>
								<!-- eslint-disable-next-line svelte/no-at-html-tags -- renderMarkdown neutralizza HTML e link (src/agent/markdown.ts, con test) -->
								{@html renderMarkdown(report.answer)}
							</div>
						</details>
					{/if}
				{/if}
			</li>
		{/each}
	</ol>
</section>
