<script lang="ts">
	import { ACCENT_THEMES, ACCENT_COOKIE, type AccentTheme } from '$lib/themes';
	import { untrack } from 'svelte';

	// `accent` arriva dal layout (cookie risolto in SSR): l'indicatore parte già
	// sulla selezione giusta e il colore è applicato pre-paint sull'attributo style
	// di <html>, quindi qui non serve né rileggere lo storage né ri-applicarlo al load.
	let { accent = 'blue', lang = 'it' }: { accent?: string; lang?: string } = $props();

	// Valore iniziale dalla prop; poi `active` è gestito localmente da select().
	let active = $state(untrack(() => accent));

	function setVars(accent: string, soft: string) {
		const el = document.documentElement;
		el.style.setProperty('--color-accent', accent);
		el.style.setProperty('--color-accent-soft', soft);
	}

	/* Versione precedente: "hue-sweep". Cambiando tema la tinta ruotava lungo il cerchio
	   cromatico (rAF, ~600ms) invece del crossfade CSS attuale. DISATTIVATA (commentata,
	   non rimossa) perché troppo vistosa. Per riattivarla: (1) rimetti i campi h/s/l su
	   AccentTheme in themes.ts -> blue {h:197,s:92,l:57}, orange {h:28,s:100,l:55},
	   violet {h:271,s:91,l:65}; (2) togli la transition su --color-accent in globals.css;
	   (3) in select() usa il ramo qui sotto al posto del setVars diretto.

	let rafId = 0;

	// Replica la logica motion del sito (data-motion override + prefers-reduced-motion).
	function motionReduced(): boolean {
		const m = document.documentElement.dataset.motion;
		if (m === 'reduced') return true;
		if (m === 'full') return false;
		return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	}

	const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

	// Ruota la tinta dal colore attuale al nuovo lungo il percorso più breve del
	// cerchio cromatico, poi fa snap al valore esatto.
	function animateTo(from: AccentTheme, to: AccentTheme) {
		cancelAnimationFrame(rafId);
		let dh = to.h - from.h;
		if (dh > 180) dh -= 360;
		if (dh < -180) dh += 360;
		const duration = 600;
		const start = performance.now();
		const step = (now: number) => {
			const t = Math.min(1, (now - start) / duration);
			const e = easeInOutCubic(t);
			const h = from.h + dh * e;
			const s = from.s + (to.s - from.s) * e;
			const l = from.l + (to.l - from.l) * e;
			setVars(
				`hsl(${h.toFixed(1)} ${s.toFixed(1)}% ${l.toFixed(1)}%)`,
				`hsl(${h.toFixed(1)} ${Math.max(s - 8, 0).toFixed(1)}% ${Math.min(l + 18, 90).toFixed(1)}%)`
			);
			if (t < 1) rafId = requestAnimationFrame(step);
			else setVars(to.accent, to.soft);
		};
		rafId = requestAnimationFrame(step);
	}

	// Nel select(): const from = ACCENT_THEMES.find((t) => t.id === active) ?? ACCENT_THEMES[0];
	//               if (motionReduced()) setVars(theme.accent, theme.soft); else animateTo(from, theme);
	$effect(() => () => cancelAnimationFrame(rafId));
	*/

	function select(theme: AccentTheme) {
		if (theme.id === active) return;
		active = theme.id;
		// Cookie (non localStorage): leggibile dal server, applica il tema in SSR.
		document.cookie = `${ACCENT_COOKIE}=${theme.id}; path=/; max-age=31536000; samesite=lax`;
		// Snap del valore: il crossfade tra vecchio e nuovo accento è gestito in CSS
		// (transition su --color-accent, registrato come <color> in globals).
		setVars(theme.accent, theme.soft);
	}

	let activeIndex = $derived(
		Math.max(
			0,
			ACCENT_THEMES.findIndex((t) => t.id === active)
		)
	);
	let activeTheme = $derived(ACCENT_THEMES[activeIndex]);
	let nextTheme = $derived(ACCENT_THEMES[(activeIndex + 1) % ACCENT_THEMES.length]);

	const name = (t: AccentTheme) => (lang === 'en' ? t.en : t.it);
	let labelPrefix = $derived(lang === 'en' ? 'Accent' : 'Accento');
	// Il tasto mobile cicla: dice cos'è acceso ora e cosa succede al tocco.
	let cycleLabel = $derived(
		lang === 'en'
			? `Accent: ${name(activeTheme)}. Switch to ${name(nextTheme)}`
			: `Accento: ${name(activeTheme)}. Passa a ${name(nextTheme)}`
	);
</script>

<!-- Sotto lg: un tasto solo nel dock, con il LED del colore acceso; ogni tocco passa al
     colore successivo. Stessa forma del menu e del torna su, così i tre flottanti sono
     lo stesso oggetto. Da lg il picker scende nel rail sinistro del telaio: tre keycap
     da 26px con un LED dentro, acceso solo quello premuto. -->
<button
	type="button"
	onclick={() => select(nextTheme)}
	aria-label={cycleLabel}
	class="key key--icon key--float fixed bottom-4 left-4 z-50 lg:hidden"
>
	<span
		class="block h-3 w-3 rounded-full bg-accent shadow-[0_0_10px] shadow-accent/70"
		aria-hidden="true"
	></span>
</button>

<div
	class="fixed bottom-[calc(var(--chassis-gutter)+1rem)] left-0 z-50 hidden w-[var(--chassis-gutter)] flex-col items-center gap-1.5 lg:flex"
	role="group"
	aria-label={labelPrefix}
>
	{#each ACCENT_THEMES as theme (theme.id)}
		<button
			type="button"
			onclick={() => select(theme)}
			aria-label="{labelPrefix} {name(theme)}"
			aria-pressed={active === theme.id}
			class="key key--led h-[26px] w-[26px] justify-center p-0"
			style="--dot: {theme.accent};"
		>
			<span class="accent-dot block h-2 w-2 rounded-full"></span>
		</button>
	{/each}
</div>
