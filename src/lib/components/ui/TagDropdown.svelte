<script lang="ts">
	import type { GlobalContent } from '$lib/types';
	import { getTranslations, translateTag, type TranslationKey } from '$lib/utils/translations';
	import { Check, ChevronDown, Tag } from '@lucide/svelte';
	import Dropdown from './Dropdown.svelte';

	interface Props {
		availableTags: string[];
		selectedTags: string[];
		onTagToggle: (tag: string) => void;
		onClearTags?: () => void;
		global?: GlobalContent;
	}

	let { availableTags, selectedTags, onTagToggle, onClearTags, global }: Props = $props();

	const translationKeys: TranslationKey[] = ['tags', 'searchTags', 'closeTagDropdown', 'clearTags'];
	let t = $derived(getTranslations(global, translationKeys));

	let isOpen = $state(false);
	let tagSearchQuery = $state('');
	let triggerElement = $state<HTMLButtonElement>();
	let dropdownContentElement = $state<HTMLElement>();

	// Generate unique IDs for ARIA
	const dropdownId = `tag-dropdown-${Math.random().toString(36).substring(7)}`;
	const triggerId = `tag-trigger-${Math.random().toString(36).substring(7)}`;

	const filteredTags = $derived(
		availableTags.filter((tag) => tag.toLowerCase().includes(tagSearchQuery.toLowerCase()))
	);

	// Helper function to check if a tag is selected (case-insensitive)
	const isTagSelected = (tag: string): boolean => {
		return selectedTags.some((selectedTag) => selectedTag.toLowerCase() === tag.toLowerCase());
	};

	// Count actually selected tags from available tags (case-insensitive)
	const selectedTagsCount = $derived(availableTags.filter((tag) => isTagSelected(tag)).length);

	const toggleDropdown = () => {
		if (!isOpen) {
			// Calculate position before opening
			if (triggerElement) {
				triggerElement.focus();
			}
		}
		isOpen = !isOpen;
		if (!isOpen) {
			tagSearchQuery = '';
		}
	};

	const handleTagSelect = (tag: string) => {
		onTagToggle(tag);
	};

	const closeDropdown = () => {
		isOpen = false;
		tagSearchQuery = '';
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
		<Tag class="h-4 w-4" />
		{t.tags}
		{#if selectedTagsCount > 0}
			<span class="ml-1 rounded-full bg-white/15 px-2 py-1 text-xs backdrop-blur-sm">
				{selectedTagsCount}
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
		maxHeight="20rem"
		role="listbox"
		enableFocusTrap={true}
		autoFocus={false}
	>
		<div class="p-3" bind:this={dropdownContentElement} tabindex="-1">
			<input
				type="text"
				bind:value={tagSearchQuery}
				placeholder={t.searchTags}
				class="w-full rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-white placeholder-white/50 backdrop-blur-sm focus:border-white/20 focus:outline-none"
			/>
		</div>
		<div class="max-h-40 space-y-1 overflow-y-auto p-2 pt-0">
			{#each filteredTags as tag (tag)}
				<button
					onclick={() => handleTagSelect(tag)}
					class="flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-left text-white/80 transition-colors {isTagSelected(
						tag
					)
						? 'bg-white/15'
						: 'hover:bg-white/10 active:bg-white/15'}"
				>
					<div
						class="flex h-4 w-4 items-center justify-center rounded border border-white/10 {isTagSelected(
							tag
						)
							? 'bg-white/15'
							: ''}"
					>
						{#if isTagSelected(tag)}
							<Check class="h-3 w-3" />
						{/if}
					</div>
					{translateTag(global, tag)}
				</button>
			{/each}
		</div>
		{#if selectedTagsCount > 0 && onClearTags}
			<div class="border-t border-white/5 p-2">
				<button
					onclick={onClearTags}
					class="w-full cursor-pointer rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-white/80 backdrop-blur-sm transition-colors hover:bg-white/10"
				>
					{t.clearTags}
				</button>
			</div>
		{/if}
	</Dropdown>
</div>
