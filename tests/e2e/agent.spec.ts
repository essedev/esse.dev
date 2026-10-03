import { expect, test } from '@playwright/test';

// L'agente: la pagina si collega via WebSocket al suo Durable Object e pi apre la
// sessione (arriva il modello). Nessun messaggio: un prompt chiamerebbe un modello vero.
test.describe('agent', () => {
	test('the page connects to its Durable Object and gets a session', async ({ page }) => {
		await page.goto('/it/agente');
		await expect(page.getByText('z-ai/glm-5.3-flash')).toBeVisible({ timeout: 15_000 });
		await expect(page.getByRole('button', { name: 'invia' })).toBeEnabled();
	});

	test('the site index for the tools is published with every language', async ({ request }) => {
		const res = await request.get('/agent/index.json');
		expect(res.status()).toBe(200);
		const docs = (await res.json()) as { lang: string; kind: string }[];
		expect(new Set(docs.map((d) => d.lang))).toEqual(new Set(['en', 'it']));
		expect(docs.some((d) => d.kind === 'project')).toBe(true);
	});
});
