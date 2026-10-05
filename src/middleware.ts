import { defineMiddleware } from 'astro:middleware';

// Security headers for the Worker's responses (redirect catch-all, 404, root). Static
// assets get them from public/_headers: the two lists must be kept aligned.
const SECURITY_HEADERS: Record<string, string> = {
	'X-Content-Type-Options': 'nosniff',
	'Referrer-Policy': 'strict-origin-when-cross-origin',
	'X-Frame-Options': 'DENY',
	'Permissions-Policy': 'geolocation=(), camera=(), microphone=(), payment=()'
};

/** Adds the security headers and `frame-ancestors` to every response of the Worker. */
export const onRequest = defineMiddleware(async (_context, next) => {
	// A copy, because some responses (redirects) have immutable headers.
	const original = await next();
	const response = new Response(original.body, original);
	for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
		response.headers.set(key, value);
	}
	// frame-ancestors in the meta tag is ignored: it must be added to the header's CSP.
	const csp = response.headers.get('Content-Security-Policy');
	response.headers.set(
		'Content-Security-Policy',
		csp ? `${csp.replace(/;?\s*$/, '')}; frame-ancestors 'none'` : "frame-ancestors 'none'"
	);
	return response;
});
