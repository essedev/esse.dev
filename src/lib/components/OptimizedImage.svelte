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

	const placeholderIcon = '/placeholder.svg';

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

<div class="relative overflow-hidden {className}">
	{#if showPlaceholder || imageNotFound}
		<div class="absolute inset-0 flex items-center justify-center bg-white/10 backdrop-blur-md">
			<img
				src={placeholderIcon}
				alt="Placeholder"
				class="h-12 w-12 opacity-60"
				style="filter: brightness(0) saturate(100%) invert(100%);"
			/>
		</div>
	{:else if isLoading}
		<div class="absolute inset-0 flex items-center justify-center bg-white/10 backdrop-blur-md">
			<div
				class="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-white/60"
			></div>
		</div>
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
		<div class="absolute inset-0 flex items-center justify-center bg-white/10 backdrop-blur-md">
			<img
				src={placeholderIcon}
				alt=""
				class="h-12 w-12 opacity-60"
				style="filter: brightness(0) saturate(100%) invert(100%);"
			/>
		</div>
	{/if}
</div>
