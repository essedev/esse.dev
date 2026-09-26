import { logoBase64 } from '$lib/assets/logo-base64.js';
import { noiseBase64 } from '$lib/assets/noise-base64.js';

/**
 * Common styles and constants for OG layouts
 */
export const OG_CONSTANTS = {
	WIDTH: 1200,
	HEIGHT: 630,
	COLORS: {
		GRADIENT: {
			START: '#0c0c0c',
			MID: '#131b49',
			END: '#20327e'
		},
		TEXT: {
			PRIMARY: '#ffffff',
			SECONDARY: '#e5e5e5',
			MUTED: '#a1a1aa'
		}
	},
	FONTS: {
		FAMILY: "Geist, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
	}
} as const;

/**
 * Base layout configuration for different page types
 */
export interface LayoutConfig {
	type: 'home' | 'listing' | 'detail';
	title?: string;
	subtitle?: string;
	excerpt?: string;
	coverImage?: string;
}

/**
 * Create home page layout data
 */
export function createHomeLayoutData(): LayoutConfig & {
	logo: { src: string; width: number; height: number };
	brandText: { primary: string; secondary: string };
} {
	return {
		type: 'home',
		logo: { src: logoBase64, width: 180, height: 180 },
		brandText: { primary: 'esse', secondary: 'dev' }
	};
}

/**
 * Create listing page layout data
 */
export function createListingLayoutData(
	title: string,
	subtitle?: string
): LayoutConfig & {
	logo: { src: string; width: number; height: number };
} {
	return {
		type: 'listing',
		title,
		subtitle,
		logo: { src: logoBase64, width: 80, height: 80 }
	};
}

/**
 * Create detail page layout data
 */
export function createDetailLayoutData(
	title: string,
	excerpt?: string,
	coverImage?: string
): LayoutConfig & {
	logo: { src: string; width: number; height: number };
	hasImage: boolean;
} {
	return {
		type: 'detail',
		title,
		excerpt: excerpt && excerpt.length > 200 ? excerpt.slice(0, 200) + '...' : excerpt,
		coverImage,
		logo: { src: logoBase64, width: 120, height: 120 },
		hasImage: !!coverImage
	};
}

/**
 * Common background and noise pattern for all layouts
 */
export function getCommonBackgroundElements() {
	return {
		gradient: {
			id: 'bg',
			colors: [
				{ offset: '0%', color: OG_CONSTANTS.COLORS.GRADIENT.START },
				{ offset: '50%', color: OG_CONSTANTS.COLORS.GRADIENT.MID },
				{ offset: '100%', color: OG_CONSTANTS.COLORS.GRADIENT.END }
			]
		},
		noise: {
			src: noiseBase64,
			opacity: 0.5,
			blendMode: 'overlay'
		}
	};
}
