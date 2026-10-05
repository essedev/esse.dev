import { defineConfig } from 'vitest/config';

// Unit tests on the pure functions of src/lib, in Node. No Astro getViteConfig: with the
// Cloudflare adapter it would run vitest inside workerd.
export default defineConfig({
	test: { include: ['tests/unit/**/*.test.ts'] }
});
