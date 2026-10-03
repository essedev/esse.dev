<script lang="ts">
	import type { Status } from '../lib/listing';

	let { status, label }: { status: Status; label: string } = $props();

	const DOT: Record<Status, string> = {
		'in-progress': 'bg-status-progress',
		completed: 'bg-status-completed',
		idea: 'bg-status-idea',
		archived: 'bg-status-archived'
	};
</script>

<span class="inline-flex items-center gap-1.5 text-xs text-muted">
	<span class="size-1.5 rounded-full {DOT[status]}" aria-hidden="true"></span>
	{label}
</span>
