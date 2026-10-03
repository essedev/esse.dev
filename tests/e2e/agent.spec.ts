import { expect, test } from '@playwright/test';

// L'agente: la pagina si collega via WebSocket al suo Durable Object e pi apre la
// sessione (arriva il modello). Nessun messaggio: un prompt chiamerebbe un modello vero.
test.describe('agent', () => {
	test('the page connects to its Durable Object and gets a session', async ({ page }) => {
		await page.goto('/it/agente');
		await expect(page.getByText('z-ai/glm-5.3-flash')).toBeVisible({ timeout: 15_000 });
		await expect(page.getByRole('button', { name: 'invia' })).toBeEnabled();
	});

	test('an empty conversation lists the tools from the server and suggests questions', async ({
		page
	}) => {
		await page.goto('/en/agent');
		await page.getByRole('button', { name: 'new conversation' }).click();
		await expect(page.getByText('search_site')).toBeVisible({ timeout: 15_000 });
		await expect(page.getByText('read_page')).toBeVisible();
		await expect(page.locator('main ul button')).toHaveCount(3);
	});

	test('the input sits at the bottom of the pane', async ({ page }) => {
		await page.setViewportSize({ width: 1440, height: 900 });
		await page.goto('/en/agent');
		const form = await page.locator('form').boundingBox();
		expect(form!.y + form!.height).toBeGreaterThan(900 - 80);
	});

	test('the site index for the tools is published with every language', async ({ request }) => {
		const res = await request.get('/agent/index.json');
		expect(res.status()).toBe(200);
		const docs = (await res.json()) as { lang: string; kind: string }[];
		expect(new Set(docs.map((d) => d.lang))).toEqual(new Set(['en', 'it']));
		expect(docs.some((d) => d.kind === 'project')).toBe(true);
	});
});
