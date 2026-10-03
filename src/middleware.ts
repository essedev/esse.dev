import { defineMiddleware } from 'astro:middleware';

// Header di sicurezza per le risposte del Worker (catch-all dei redirect, 404, root).
// Gli asset statici li ricevono da public/_headers: i due elenchi vanno tenuti allineati.
const SECURITY_HEADERS: Record<string, string> = {
	'X-Content-Type-Options': 'nosniff',
	'Referrer-Policy': 'strict-origin-when-cross-origin',
	'X-Frame-Options': 'DENY',
	'Permissions-Policy': 'geolocation=(), camera=(), microphone=(), payment=()'
};

export const onRequest = defineMiddleware(async (_context, next) => {
	// Una copia, perché alcune risposte (i redirect) hanno gli header immutabili.
	const original = await next();
	const response = new Response(original.body, original);
	for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
		response.headers.set(key, value);
	}
	// frame-ancestors nel meta tag è ignorato: va aggiunto alla CSP dell'header.
	const csp = response.headers.get('Content-Security-Policy');
	response.headers.set(
		'Content-Security-Policy',
		csp ? `${csp.replace(/;?\s*$/, '')}; frame-ancestors 'none'` : "frame-ancestors 'none'"
	);
	return response;
});
