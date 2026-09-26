<script lang="ts">
	import type { GlobalContent } from '$lib/types';
	import { getTranslations, type TranslationKey } from '$lib/utils/translations';
	import { Check, ChevronDown, Activity } from '@lucide/svelte';
	import Dropdown from './Dropdown.svelte';

	interface Props {
		availableStatuses: string[];
		selectedStatuses: string[];
		onStatusToggle: (status: string) => void;
		onClearStatuses?: () => void;
		global?: GlobalContent;
	}

	let { availableStatuses, selectedStatuses, onStatusToggle, onClearStatuses, global }: Props =
		$props();

	const translationKeys: TranslationKey[] = [
		'status',
		'statusCompleted',
		'statusInProgress',
		'statusIdea',
		'statusArchived',
		'closeStatusDropdown',
		'clearStatuses'
	];
	let t = $derived(getTranslations(global, translationKeys));

	let isOpen = $state(false);
	let triggerElement = $state<HTMLButtonElement>();
	let dropdownContentElement = $state<HTMLElement>();

	// Generate unique IDs for ARIA
	const dropdownId = `status-dropdown-${Math.random().toString(36).substring(7)}`;
	const triggerId = `status-trigger-${Math.random().toString(36).substring(7)}`;

	// Status translations mapping
	const statusTranslations = $derived({
		completed: t.statusCompleted,
		'in-progress': t.statusInProgress,
		idea: t.statusIdea,
		archived: t.statusArchived
	} as Record<string, string>);

	const toggleDropdown = () => {
		if (!isOpen) {
			// Calculate position before opening
			if (triggerElement) {
				triggerElement.focus();
			}
		}
		isOpen = !isOpen;
	};

	const handleStatusSelect = (status: string) => {
		onStatusToggle(status);
	};

	const closeDropdown = () => {
		isOpen = false;
	};
</script>

<div class="relative">
	<button
		bind:this={triggerElement}
		id={triggerId}
		aria-expanded={isOpen}
		aria-haspopup="listbox"
		aria-controls={dropdownId}
		onclick={toggleDropdown}
		class="flex w-full cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-white/80 backdrop-blur-md transition-colors hover:bg-white/10"
		style="touch-action: manipulation;"
	>
		<Activity class="h-4 w-4" />
		{t.status}
		{#if selectedStatuses.length > 0}
			<span class="ml-1 rounded-full bg-white/15 px-2 py-1 text-xs backdrop-blur-sm">
				{selectedStatuses.length}
			</span>
		{/if}
		<ChevronDown class="ml-auto h-4 w-4" />
	</button>

	<Dropdown
		{isOpen}
		{triggerElement}
		{dropdownId}
		{triggerId}
		onClose={closeDropdown}
		maxHeight="16rem"
		role="listbox"
		enableFocusTrap={true}
		autoFocus={false}
	>
		<div class="space-y-1 p-2" bind:this={dropdownContentElement} tabindex="-1">
			{#each availableStatuses as status (status)}
				<button
					onclick={() => handleStatusSelect(status)}
					class="flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-left text-white/80 transition-colors {selectedStatuses.includes(
						status
					)
						? 'bg-white/15'
						: 'hover:bg-white/10 active:bg-white/15'}"
				>
					<div
						class="flex h-4 w-4 items-center justify-center rounded border border-white/10 {selectedStatuses.includes(
							status
						)
							? 'bg-white/15'
							: ''}"
					>
						{#if selectedStatuses.includes(status)}
							<Check class="h-3 w-3" />
						{/if}
					</div>
					{statusTranslations[status] || status}
				</button>
			{/each}
		</div>
		{#if selectedStatuses.length > 0 && onClearStatuses}
			<div class="border-t border-white/5 p-2">
				<button
					onclick={onClearStatuses}
					class="w-full cursor-pointer rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-white/80 backdrop-blur-sm transition-colors hover:bg-white/10"
				>
					{t.clearStatuses}
				</button>
			</div>
		{/if}
	</Dropdown>
</div>
