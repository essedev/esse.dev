<script lang="ts">
	import { onMount } from 'svelte';
	import { DRAFT_LIMITS } from '../../agent/draft';

	/**
	 * The `draft_message` draft: the visitor rereads it, edits it, leaves a contact if they
	 * want and sends it themselves, after Turnstile. The model cannot send: sending starts only
	 * from here, and the server rechecks everything.
	 */
	type Labels = {
		draft: string;
		subject: string;
		contact: string;
		send: string;
		sending: string;
		sent: string;
	};
	let {
		subject: initialSubject,
		text: initialText,
		delivery,
		siteKey,
		labels,
		onsend
	}: {
		subject: string;
		text: string;
		delivery: { status: 'sending' | 'sent' | 'error'; message?: string } | undefined;
		siteKey: string;
		labels: Labels;
		onsend: (fields: { subject: string; text: string; contact: string; turnstile: string }) => void;
	} = $props();

	// Start from the agent's draft, then the fields belong to the visitor.
	// svelte-ignore state_referenced_locally
	let subject = $state(initialSubject);
	// svelte-ignore state_referenced_locally
	let text = $state(initialText);
	let contact = $state('');
	let token = $state('');
	let widget: HTMLDivElement | undefined = $state();

	const sent = $derived(delivery?.status === 'sent');
	const busy = $derived(delivery?.status === 'sending');

	type Turnstile = {
		render(el: HTMLElement, options: Record<string, unknown>): string;
		reset(id: string): void;
		remove(id: string): void;
	};
	const SCRIPT = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

	/** The Turnstile script, loaded once and only when a draft needs it. */
	function turnstile(): Promise<Turnstile> {
		const w = window as unknown as { turnstile?: Turnstile; __turnstile?: Promise<Turnstile> };
		if (w.turnstile) return Promise.resolve(w.turnstile);
		w.__turnstile ??= new Promise((resolve, reject) => {
			const script = document.createElement('script');
			script.src = SCRIPT;
			script.async = true;
			script.onload = () => (w.turnstile ? resolve(w.turnstile) : reject(new Error('turnstile')));
			script.onerror = () => reject(new Error('turnstile'));
			document.head.append(script);
		});
		return w.__turnstile;
	}

	let widgetId: string | undefined;
	let api: Turnstile | undefined;
	onMount(() => {
		if (sent) return;
		let cancelled = false;
		turnstile()
			.then((t) => {
				if (cancelled || !widget) return;
				api = t;
				widgetId = t.render(widget, {
					sitekey: siteKey,
					// The site's theme when the widget is drawn; a toggle later does not redraw it.
					theme: document.documentElement.dataset.theme === 'light' ? 'light' : 'dark',
					size: 'flexible',
					callback: (value: string) => (token = value),
					'expired-callback': () => (token = ''),
					'error-callback': () => (token = '')
				});
			})
			.catch(() => {});
		return () => {
			cancelled = true;
			if (api && widgetId) api.remove(widgetId);
		};
	});

	// Once the draft is sent the widget is no longer needed: remove it before it leaves the DOM.
	$effect.pre(() => {
		if (sent && api && widgetId) {
			api.remove(widgetId);
			widgetId = undefined;
		}
	});

	// A token is good only once: after an error the widget is rebuilt.
	$effect(() => {
		if (delivery?.status === 'error' && api && widgetId) {
			token = '';
			api.reset(widgetId);
		}
	});

	function submit(event: SubmitEvent) {
		event.preventDefault();
		if (!token || busy || sent) return;
		onsend({ subject, text, contact, turnstile: token });
	}

	const field =
		'w-full rounded-[var(--radius-control)] bg-surface px-3 py-2 text-[0.9375rem] text-fg outline-none placeholder:text-subtle focus:bg-hover disabled:opacity-60';
</script>

<form
	onsubmit={submit}
	class="flex flex-col gap-3 rounded-[var(--radius-control)] bg-surface/60 px-4 py-4"
>
	<p class="flex items-center gap-2.5 font-mono text-xs text-subtle">
		<span class="led" data-status={sent ? 'completed' : 'in-progress'}></span>
		draft_message · {labels.draft}
	</p>
	<input
		bind:value={subject}
		disabled={sent}
		maxlength={DRAFT_LIMITS.subjectChars}
		aria-label={labels.subject}
		class={field}
	/>
	<textarea
		bind:value={text}
		disabled={sent}
		maxlength={DRAFT_LIMITS.textChars}
		rows="6"
		aria-label={labels.draft}
		class={[field, '[field-sizing:content] min-h-32 resize-none leading-relaxed']}></textarea>
	{#if !sent}
		<input
			bind:value={contact}
			maxlength={DRAFT_LIMITS.contactChars}
			placeholder={labels.contact}
			aria-label={labels.contact}
			class={field}
		/>
		<div bind:this={widget} class="min-h-[65px]"></div>
	{/if}
	<div class="flex items-center gap-3">
		{#if sent}
			<p class="font-mono text-xs text-live">{labels.sent}</p>
		{:else}
			<button
				type="submit"
				disabled={!token || busy || !text.trim() || !subject.trim()}
				class="chip hover:text-fg disabled:opacity-40"
			>
				{busy ? labels.sending : labels.send}
			</button>
		{/if}
		{#if delivery?.status === 'error'}
			<p class="font-mono text-xs text-danger">{delivery.message}</p>
		{/if}
	</div>
</form>
