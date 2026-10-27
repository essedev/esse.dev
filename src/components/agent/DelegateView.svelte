<script lang="ts">
	import type { ChildRecord, ChildReport } from '../../agent/delegate';
	import { renderMarkdown } from '../../agent/markdown';

	/**
	 * The sub-agents of a `delegate` call. In the background (DECISIONS #33) the rows are the
	 * children with their live state, and a row opens the child's sheet. Calls from before #33
	 * carry the reports in the result: for each child the calls made, tokens, cost and the
	 * answer, expandable.
	 */
	let {
		tasks,
		reports,
		children,
		labels,
		tokens,
		spent,
		statusLabel,
		onopen
	}: {
		tasks: { title: string; task: string }[];
		/** Only on calls from before #33. */
		reports: ChildReport[] | null;
		/** The call's children, in task order; empty while the call has no result. */
		children: ChildRecord[];
		labels: { subagents: string; answer: string };
		tokens: (n: number) => string;
		spent: (usd: number) => string;
		statusLabel: (status: ChildRecord['status']) => string;
		onopen: (id: number) => void;
	} = $props();

	const led = (status: ChildRecord['status']) =>
		status === 'working' ? 'in-progress' : status === 'done' ? 'completed' : 'idea';
</script>

<section class="flex flex-col gap-2 rounded-[var(--radius-control)] bg-surface/60 px-4 py-3">
	<h3 class="font-mono text-xs text-subtle">delegate · {tasks.length} {labels.subagents}</h3>
	<ol class="flex flex-col gap-1">
		{#each tasks as task, i (i)}
			{@const report = reports?.[i]}
			{@const child = children[i]}
			<li class="flex flex-col gap-1">
				{#if child}
					<button
						type="button"
						onclick={() => onopen(child.id)}
						class="-mx-2 flex cursor-pointer items-center gap-2.5 rounded-[var(--radius-control)] px-2 py-1.5 text-left text-sm transition-colors hover:bg-surface/60"
					>
						<span class="led" data-status={led(child.status)}></span>
						<span class="min-w-0 truncate text-fg">{child.title || task.title}</span>
						<span class="ml-auto shrink-0 font-mono text-[0.7rem] text-subtle">
							{statusLabel(child.status)}{#if child.status === 'done'}<span>
									· {tokens(child.tokens ?? 0)} token · {spent(child.usd ?? 0)}</span
								>{/if}
						</span>
					</button>
				{:else}
					<div class="flex items-center gap-2.5 text-sm">
						<span
							class="led"
							data-status={!report && !reports
								? 'in-progress'
								: report?.error
									? 'archived'
									: 'completed'}
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
									<!-- eslint-disable-next-line svelte/no-at-html-tags -- renderMarkdown neutralizes HTML and links (src/agent/markdown.ts, with tests) -->
									{@html renderMarkdown(report.answer)}
								</div>
							</details>
						{/if}
					{/if}
				{/if}
			</li>
		{/each}
	</ol>
</section>
