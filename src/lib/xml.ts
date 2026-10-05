/**
 * XML escaping, shared by the feed, the sitemap and the OG layout.
 */

/** Escapes text for XML/HTML (feed, sitemap, OG layout). */
export function escapeXml(value: string): string {
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
}
