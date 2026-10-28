import { getImage } from 'astro:assets';
import type { ImageMetadata } from 'astro';
import type { Project } from './content';
import type { Picture, ThemedPicture } from './listing';

/**
 * A project's logo and cover resolved at build time with `getImage`, so a Svelte island can
 * place them as plain `<img>` with the same optimized files the Astro pages use.
 */

const LOGO_PX = 20;
const COVER_WIDTHS = [320, 640, 960];

async function logoPicture(image: ImageMetadata): Promise<Picture> {
	// An SVG stays as it is, like in ProjectLogo.
	if (image.format === 'svg') return { src: image.src };
	const out = await getImage({ src: image, width: LOGO_PX, height: LOGO_PX, densities: [1, 2] });
	return { src: out.src, srcset: out.srcSet.attribute };
}

async function coverPicture(image: ImageMetadata): Promise<Picture> {
	const out = await getImage({ src: image, widths: COVER_WIDTHS, format: 'webp' });
	return { src: out.src, srcset: out.srcSet.attribute };
}

/** The logo of a project, with its light variant when it has one. */
export async function projectLogo(p: Project): Promise<ThemedPicture | undefined> {
	const { logo, logoLight } = p.meta;
	if (!logo) return undefined;
	return {
		dark: await logoPicture(logo),
		light: logoLight ? await logoPicture(logoLight) : undefined
	};
}

/** The cover of a project, with its light variant and focus; none for a generated cover. */
export async function projectCover(
	p: Project
): Promise<(ThemedPicture & { focus: 'top' | 'center' | 'bottom' }) | undefined> {
	const cover = p.meta.cover;
	if (!cover) return undefined;
	return {
		dark: await coverPicture(cover.src),
		light: cover.srcLight ? await coverPicture(cover.srcLight) : undefined,
		focus: cover.focus ?? 'center'
	};
}
