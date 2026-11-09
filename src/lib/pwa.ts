/**
 * The installed app (DECISIONS #47): the screenshots its manifest offers to the install
 * dialogs, shared by the manifest (src/pages/[lang]/manifest.webmanifest.ts) and the script
 * that captures them (scripts/pwa-screenshots.ts).
 */

/** A screenshot of the site for the install dialog: a phone (`narrow`) or a desktop (`wide`). */
export interface Screenshot {
	form: 'narrow' | 'wide';
	/** The CSS viewport it is taken at. */
	viewport: { width: number; height: number };
	/** Device pixels per CSS pixel: the file is `viewport * scale`. */
	scale: number;
}

/** The screenshots, one set per language; the install dialogs pick by form factor. */
export const SCREENSHOTS: readonly Screenshot[] = [
	{ form: 'narrow', viewport: { width: 390, height: 844 }, scale: 2 },
	{ form: 'wide', viewport: { width: 1440, height: 900 }, scale: 1 }
];

/** The published path of a screenshot, `/pwa/it-narrow.webp`. */
export const screenshotPath = (lang: string, shot: Screenshot): string =>
	`/pwa/${lang}-${shot.form}.webp`;
