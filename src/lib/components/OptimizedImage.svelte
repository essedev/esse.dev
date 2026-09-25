<script lang="ts">
	let {
		src = null,
		alt = '',
		className = '',
		loading = 'lazy',
		showPlaceholder = false,
		sizes = '100vw',
		...restProps
	}: {
		src?: string | null;
		alt?: string;
		className?: string;
		loading?: 'lazy' | 'eager';
		showPlaceholder?: boolean;
		sizes?: string;
		[key: string]: unknown;
	} = $props();

	// Pre-load all images using import.meta.glob for vite-imagetools
	const articleImages = import.meta.glob('../assets/images/articles/**/*.{jpg,jpeg,png,webp}', {
		query: '?as=srcset&format=avif;webp;jpg&w=400;800;1200',
		eager: false
	});

	const projectImages = import.meta.glob('../assets/images/projects/**/*.{jpg,jpeg,png,webp}', {
		query: '?as=srcset&format=avif;webp;jpg&w=400;800;1200',
		eager: false
	});

	let optimizedImage: {
		sources?: { avif: string; webp: string; jpeg: string };
		img: { src: string };
	} | null = $state(null);
	let isLoading = $state(true);
	let imageNotFound = $state(false);

	$effect(() => {
		const loadImage = async () => {
			// Reset state
			imageNotFound = false;

			if (!src || showPlaceholder) {
				isLoading = false;
				return;
			}

			try {
				// Parse the image path to extract components
				if (src.startsWith('/images/') || src.startsWith('images/')) {
					const cleanPath = src.startsWith('/') ? src.substring(1) : src;

					// Look for the image in our pre-loaded glob imports
					const fullPath = `../assets/${cleanPath}`;
					let imageLoader: (() => Promise<unknown>) | null = null;

					// Check article images first
					if (cleanPath.includes('articles/')) {
						imageLoader = articleImages[fullPath];
					}
					// Then check project images
					else if (cleanPath.includes('projects/')) {
						imageLoader = projectImages[fullPath];
					}

					if (imageLoader) {
						const imageModule = (await imageLoader()) as { default?: string };

						// vite-imagetools returns a srcset string in imageModule.default
						if (imageModule.default && typeof imageModule.default === 'string') {
							const srcsetString = imageModule.default;

							// vite-imagetools restituisce gli URL nell'ordine dei formati
							// richiesti (avif, webp, jpg), ciascuno con N dimensioni. In dev
							// gli URL non hanno estensione, quindi raggruppiamo per posizione.
							// Deriviamo N dal conteggio reale invece di assumerlo: così il
							// componente si adatta se cambia il numero di larghezze.
							const srcsets = srcsetString.split(', ').filter(Boolean);

							const numFormats = 3; // avif, webp, jpg
							if (srcsets.length === 0) {
								imageNotFound = true;
								return;
							}
							const sizesPerFormat = Math.max(1, Math.floor(srcsets.length / numFormats));
							const avifSrcs = srcsets.slice(0, sizesPerFormat);
							const webpSrcs = srcsets.slice(sizesPerFormat, sizesPerFormat * 2);
							const jpegSrcs = srcsets.slice(sizesPerFormat * 2, sizesPerFormat * 3);

							// Use the first JPEG as fallback
							const fallbackSrc =
								jpegSrcs.length > 0 ? jpegSrcs[0].split(' ')[0] : srcsets[0].split(' ')[0];

							// Create the expected structure for our component
							optimizedImage = {
								sources: {
									avif: avifSrcs.join(', '),
									webp: webpSrcs.join(', '),
									jpeg: jpegSrcs.join(', ')
								},
								img: {
									src: fallbackSrc
								}
							};
						} else {
							// Fallback to placeholder if unexpected structure
							imageNotFound = true;
						}
					} else {
						// Image not found in glob - show placeholder
						imageNotFound = true;
					}
				} else {
					// For non-images/ paths, use as-is
					optimizedImage = { img: { src } };
				}
			} catch {
				// Fallback to placeholder on error
				imageNotFound = true;
			} finally {
				isLoading = false;
			}
		};

		loadImage();
	});
</script>

<!-- Placeholder: uno schermo spento, non una lastra grigia con l'icona "immagine". Nero
     con il bagliore d'accento all'orizzonte (come il pavimento del sito) e l'alt come
     etichetta di nastro in basso a sinistra: legge come un monitor in attesa del
     segnale, che è lo stato vero finché le immagini non ci sono. -->
{#snippet screen()}
	<div class="absolute inset-0 bg-[#090909]">
		<!-- La stessa griglia del pavimento del sito, in piccolo e sfumata verso l'alto. -->
		<div
			class="absolute inset-0"
			style="background-image: linear-gradient(to right, rgb(255 255 255 / 0.05) 1px, transparent 1px), linear-gradient(to bottom, rgb(255 255 255 / 0.05) 1px, transparent 1px); background-size: 24px 24px; mask-image: linear-gradient(to top, #000 10%, transparent 85%);"
		></div>
		<div
			class="absolute inset-0"
			style="background: radial-gradient(ellipse 70% 60% at 50% 110%, color-mix(in srgb, var(--color-accent) 14%, transparent), transparent 70%);"
		></div>
		{#if alt}
			<span class="label absolute bottom-3 left-3 text-gray-600">{alt}</span>
		{/if}
	</div>
{/snippet}

<div class="relative overflow-hidden {className}">
	{#if showPlaceholder || imageNotFound}
		{@render screen()}
	{:else if isLoading}
		<div class="absolute inset-0 bg-[#090909]"></div>
	{:else if optimizedImage && optimizedImage.sources}
		<!-- vite-imagetools generated picture element with AVIF, WebP, and JPEG -->
		<picture>
			{#if optimizedImage.sources.avif}
				<source srcset={optimizedImage.sources.avif} type="image/avif" {sizes} />
			{/if}
			{#if optimizedImage.sources.webp}
				<source srcset={optimizedImage.sources.webp} type="image/webp" {sizes} />
			{/if}
			{#if optimizedImage.sources.jpeg}
				<source srcset={optimizedImage.sources.jpeg} type="image/jpeg" {sizes} />
			{/if}
			<img
				src={optimizedImage.img.src}
				{alt}
				class="h-full w-full object-cover"
				{loading}
				{...restProps}
			/>
		</picture>
	{:else if optimizedImage?.img?.src}
		<!-- Fallback single image -->
		<img
			src={optimizedImage.img.src}
			{alt}
			class="h-full w-full object-cover"
			{loading}
			{...restProps}
		/>
	{:else}
		{@render screen()}
	{/if}
</div>
