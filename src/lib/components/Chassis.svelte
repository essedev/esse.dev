<script lang="ts">
	import { browser } from '$app/environment';
	import { page } from '$app/state';
	import type { LayoutData } from '$lib/types/content';
	import { sectionOf } from '$lib/utils/i18n';

	// Telaio strumentale: cornice fissa attorno al contenuto che porta stato vivo
	// (sezione corrente, avanzamento, ora locale) invece di decorazione. I rail
	// stanno nella gutter di `--chassis-gutter`, che sotto lg vale 0: lì il telaio
	// non si monta e la status bar della navbar torna a fare il suo lavoro.
	let { data, scrollY = 0 }: { data: LayoutData; scrollY?: number } = $props();

	// Stesse voci della navbar, stesso indice numerato.
	let sections = $derived(
		(data.global?.navigation ?? []).map((route, i) => ({
			id: route.link.replace('#', ''),
			name: route.name,
			n: String(i + 1).padStart(2, '0')
		}))
	);

	// Nelle pagine di listing e dettaglio le ancore della home non esistono: la
	// sezione la dà la route, via lo stesso helper puro che usano layout e hooks.
	let routeIndex = $derived.by(() => {
		const { route, page: lang } = page.params;
		if (!route || !lang) return -1;
		const name = sectionOf(route, lang, data.navigation);
		return name ? sections.findIndex((s) => s.name === name) : -1;
	});

	let anchorIndex = $state(-1);
	let progress = $state(0);

	$effect(() => {
		// Lettura incondizionata: è la dipendenza dell'effetto. Il layout tiene già
		// scrollY, quindi qui non serve un secondo listener di scroll.
		const y = scrollY;
		if (!browser) return;
		const max = document.documentElement.scrollHeight - window.innerHeight;
		progress = max > 0 ? Math.min(1, Math.max(0, y / max)) : 0;

		// L'ultima sezione che ha superato il 40% dell'altezza viewport è quella corrente.
		const line = window.innerHeight * 0.4;
		let found = -1;
		for (let i = 0; i < sections.length; i++) {
			const el = document.getElementById(sections[i].id);
			if (el && el.getBoundingClientRect().top <= line) found = i;
		}
		anchorIndex = found;
	});

	let active = $derived(sections[anchorIndex >= 0 ? anchorIndex : routeIndex]);

	let clock = $state('');
	$effect(() => {
		if (!browser) return;
		const tick = () => {
			clock = new Date().toLocaleTimeString('it-IT', {
				hour12: false,
				timeZone: 'Europe/Rome'
			});
		};
		tick();
		const id = setInterval(tick, 1000);
		return () => clearInterval(id);
	});
</script>

<!-- Telemetria, non contenuto: fuori dall'albero di accessibilità e non cliccabile. -->
<div class="chassis hidden lg:block" aria-hidden="true">
	<!-- Matte: copre griglia e glow nella gutter, così il pavimento resta dentro lo schermo. -->
	<div class="chassis-matte"></div>
	<!-- Bordo dello schermo. -->
	<div class="chassis-frame"></div>

	<!-- Il rail superiore porta claim e lingua, cioe' stato. L'identita' sta nella barra
	     dei link: in 34px di rail il wordmark non puo' che essere minuscolo. La lingua e'
	     un controllo e vive fuori da qui, agganciata al rail dal layout. -->
	<div class="chassis-rail chassis-rail--top" style="padding-right: 4.5rem;">
		<span>Human vision <span class="text-accent">&middot; AI execution</span></span>
	</div>

	<div class="chassis-rail chassis-rail--left">
		<span class="chassis-vertical">
			<span class="text-accent">{active?.n ?? '00'}</span>
			<span class="px-1.5 text-gray-700">/</span>
			<span class="text-gray-400">{active?.name ?? 'home'}</span>
		</span>
	</div>

	<div class="chassis-rail chassis-rail--right">
		<span class="chassis-progress">
			<span class="chassis-progress__fill" style="height: {(progress * 100).toFixed(1)}%"></span>
		</span>
		<span class="chassis-progress__value">{Math.round(progress * 100)}%</span>
	</div>

	<div class="chassis-rail chassis-rail--bottom">
		<span>Milano <span class="tabular-nums text-gray-400">{clock}</span></span>
		<span>1-4 nav</span>
	</div>
</div>
