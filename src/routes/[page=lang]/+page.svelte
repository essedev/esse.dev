<script lang="ts">
	import AboutSection from '$lib/sections/About.svelte';
	import ArticlesSection from '$lib/sections/Articles.svelte';
	import ContactSection from '$lib/sections/Contact.svelte';
	import ProjectsSection from '$lib/sections/Projects.svelte';
	import WelcomeSection from '$lib/sections/Welcome.svelte';
	// import PixelBlast from '$lib/components/ui/PixelBlast.svelte';

	// Get data from parent layout
	let { data } = $props();

	function sanitizeId(link: string): string {
		return link.startsWith('#') ? link.slice(1) : link;
	}
</script>

<!--
<div
	id="top"
	class="relative overflow-hidden border-b border-white/5"
	onpointerdown={heroPointerDown}
	onpointermove={heroPointerMove}
>
	<div class="absolute inset-0">
		<PixelBlast
			variant="circle"
			color="#2a45a0"
			patternScale={3}
			patternDensity={0.85}
			edgeFade={0.12}
			speed={0.4}
			pixelSize={4}
			enableRipples={true}
			onSetupHandlers={(h) => {
				_pbDown = h.pointerDown;
				_pbMove = h.pointerMove;
			}}
		/>
	</div>
	<div
		class="relative mx-auto flex min-h-[80vh] w-full max-w-screen-2xl items-center justify-center px-4 sm:px-8 lg:px-14"
	>
		<WelcomeSection welcome={data.welcome} />
	</div>
</div>
-->

<div id="top" class="border-b border-white/5">
	<div
		class="mx-auto flex min-h-[80vh] w-full max-w-screen-2xl items-center justify-center px-4 sm:px-8 lg:px-14"
	>
		<WelcomeSection welcome={data.welcome} />
	</div>
</div>

<div id={sanitizeId(data.global.navigation[0]?.link || '#')} class="border-t border-white/5">
	<div
		class="mx-auto w-full max-w-screen-2xl px-4 pt-20 pb-24 sm:px-8 sm:pt-28 sm:pb-32 lg:px-14 2xl:py-36"
	>
		<ProjectsSection
			projects={data.projects}
			selectedLanguage={data.selectedLanguage}
			navigation={data.navigation}
			projectsPage={data.projectsPage}
			showViewAllButton={true}
			global={data.global}
		/>
	</div>
</div>

<div id={sanitizeId(data.global.navigation[1]?.link || '#')} class="border-t border-white/5">
	<div
		class="mx-auto w-full max-w-screen-2xl px-4 pt-20 pb-24 sm:px-8 sm:pt-28 sm:pb-32 lg:px-14 2xl:py-36"
	>
		<AboutSection about={data.about} />
	</div>
</div>

<div id={sanitizeId(data.global.navigation[2]?.link || '#')} class="border-t border-white/5">
	<div
		class="mx-auto w-full max-w-screen-2xl px-4 pt-20 pb-24 sm:px-8 sm:pt-28 sm:pb-32 lg:px-14 2xl:py-36"
	>
		<ArticlesSection
			articles={data.articles}
			selectedLanguage={data.selectedLanguage}
			navigation={data.navigation}
			blogPage={data.blogPage}
			showViewAllButton={true}
			global={data.global}
		/>
	</div>
</div>

<div id={sanitizeId(data.global.navigation[3]?.link || '#')} class="border-t border-white/5">
	<div
		class="mx-auto w-full max-w-screen-2xl px-4 pt-20 pb-24 sm:px-8 sm:pt-28 sm:pb-32 lg:px-14 2xl:py-36"
	>
		<ContactSection contact={data.contact} />
	</div>
</div>
