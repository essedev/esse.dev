<script lang="ts">
	import type { FilterState, GlobalContent } from '$lib/types';
	import { getTranslations, type TranslationKey } from '$lib/utils/translations';
	import {
		ArrowDownAZ,
		ArrowDownZA,
		ArrowUpDown,
		CalendarArrowDown,
		CalendarArrowUp,
		Check,
		ChevronDown
	} from '@lucide/svelte';
	import Dropdown from './Dropdown.svelte';

	interface Props {
		sortBy: FilterState['sortBy'];
		sortOrder: FilterState['sortOrder'];
		onSortChange: (sortBy: FilterState['sortBy'], sortOrder: FilterState['sortOrder']) => void;
		global?: GlobalContent;
	}

	let { sortBy, sortOrder, onSortChange, global }: Props = $props();

	const translationKeys: TranslationKey[] = [
		'sortNewest',
		'sortOldest',
		'sortTitleAZ',
		'sortTitleZA',
		'sort'
	];
	let t = $derived(getTranslations(global, translationKeys));

	let isOpen = $state(false);
	let triggerElement = $state<HTMLButtonElement>();

	// Generate unique IDs for ARIA
	const dropdownId = `sort-dropdown-${Math.random().toString(36).substring(7)}`;
	const triggerId = `sort-trigger-${Math.random().toString(36).substring(7)}`;

	const sortOptions = [
		{
			value: 'date-desc',
			sortBy: 'date' as const,
			sortOrder: 'desc' as const,
			IconComponent: CalendarArrowDown
		},
		{
			value: 'date-asc',
			sortBy: 'date' as const,
			sortOrder: 'asc' as const,
			IconComponent: CalendarArrowUp
		},
		{
			value: 'title-asc',
			sortBy: 'title' as const,
			sortOrder: 'asc' as const,
			IconComponent: ArrowDownAZ
		},
		{
			value: 'title-desc',
			sortBy: 'title' as const,
			sortOrder: 'desc' as const,
			IconComponent: ArrowDownZA
		}
	];

	const currentSort = $derived(`${sortBy}-${sortOrder}`);
	const currentSortLabel = $derived(() => {
		switch (currentSort) {
			case 'date-desc':
				return t.sortNewest;
			case 'date-asc':
				return t.sortOldest;
			case 'title-asc':
				return t.sortTitleAZ;
			case 'title-desc':
				return t.sortTitleZA;
			default:
				return t.sort;
		}
	});

	const toggleDropdown = () => {
		if (!isOpen) {
			// Calculate position before opening
			if (triggerElement) {
				triggerElement.focus();
			}
		}
		isOpen = !isOpen;
	};

	const handleSortSelect = (value: string) => {
		const [newSortBy, newSortOrder] = value.split('-') as [
			FilterState['sortBy'],
			FilterState['sortOrder']
		];
		onSortChange(newSortBy, newSortOrder);
		isOpen = false;
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
		aria-haspopup="menu"
		aria-controls={dropdownId}
		onclick={toggleDropdown}
		class="flex w-full cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-white/80 backdrop-blur-md transition-colors hover:bg-white/10"
		style="touch-action: manipulation;"
	>
		<ArrowUpDown class="h-4 w-4" />
		<span class="truncate">
			{currentSortLabel()}
		</span>
		<ChevronDown class="ml-auto h-4 w-4" />
	</button>

	<Dropdown
		{isOpen}
		{triggerElement}
		{dropdownId}
		{triggerId}
		onClose={closeDropdown}
		role="menu"
		enableFocusTrap={true}
	>
		<div class="space-y-1 p-2">
			{#each sortOptions as option (option.value)}
				{@const label =
					option.value === 'date-desc'
						? t.sortNewest
						: option.value === 'date-asc'
							? t.sortOldest
							: option.value === 'title-asc'
								? t.sortTitleAZ
								: t.sortTitleZA}
				<button
					onclick={() => handleSortSelect(option.value)}
					class="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors
						{currentSort === option.value ? 'bg-white/10' : 'hover:bg-white/5 active:bg-white/10'} w-full"
				>
					<div
						class="flex h-8 w-8 items-center justify-center rounded-md bg-white/10 text-white/80 backdrop-blur-sm"
					>
						<option.IconComponent class="h-4 w-4" />
					</div>
					<div class="min-w-0 flex-1">
						<div class="text-white/90">
							{label}
						</div>
					</div>
					{#if currentSort === option.value}
						<Check class="h-4 w-4 text-white/70" />
					{/if}
				</button>
			{/each}
		</div>
	</Dropdown>
</div>
