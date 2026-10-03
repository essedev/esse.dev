import { defineConfig } from 'vitest/config';

// Test unitari sulle funzioni pure di src/lib, in Node. Niente getViteConfig di Astro:
// con l'adapter Cloudflare farebbe girare vitest dentro workerd.
export default defineConfig({
	test: { include: ['tests/unit/**/*.test.ts'] }
});
