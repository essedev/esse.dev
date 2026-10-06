import { expect, test, type Page, type WebSocketRoute } from '@playwright/test';

// The states of the agent page (concept G) against a fake server: the WebSocket to the
// Durable Object is answered by the test with pi's events, so the page goes through a whole
// run without calling a model. The event shapes are pi-durable's (`AgentEvent`).

const MODEL = { provider: 'openrouter', modelId: 'z-ai/glm-5.3-flash' };
const usage = (tokens: number) => ({
	input: 0,
	output: 0,
	cacheRead: 0,
	cacheWrite: 0,
	totalTokens: tokens,
	cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0.001 }
});
const assistant = (content: unknown[], extra: Record<string, unknown> = {}) => ({
	role: 'assistant',
	content,
	api: 'openai-completions',
	provider: MODEL.provider,
	model: MODEL.modelId,
	usage: usage(2400),
	stopReason: 'stop',
	timestamp: Date.now(),
	...extra
});
const snapshot = {
	type: 'snapshot',
	entries: [],
	tools: [],
	inbox: [],
	agent: { model: MODEL }
};

type Server = { ws: WebSocketRoute; submitted: Promise<string> };

/** Answers the page's socket: tool catalog and an empty session, then waits for a message. */
async function fakeServer(page: Page): Promise<() => Server> {
	let server: Server | undefined;
	await page.routeWebSocket(/\/agents\/site-agent\//, (ws) => {
		let resolve: (text: string) => void = () => {};
		const submitted = new Promise<string>((r) => (resolve = r));
		ws.onMessage((raw) => {
			const message = JSON.parse(String(raw)) as { type: string; input?: string };
			if (message.type === 'submit') resolve(message.input ?? '');
		});
		ws.send(JSON.stringify({ type: 'hello', tools: [{ name: 'search_site', description: '' }] }));
		ws.send(JSON.stringify({ type: 'events', events: [snapshot] }));
		server = { ws, submitted };
	});
	return () => server!;
}

const events = (ws: WebSocketRoute, ...list: unknown[]) =>
	ws.send(JSON.stringify({ type: 'events', events: list }));

async function ask(page: Page, text: string) {
	await expect(page.getByText(MODEL.modelId)).toBeVisible({ timeout: 15_000 });
	await page.locator('[data-agent-input]').fill(text);
	await page.locator('[data-agent-input]').press('Enter');
}

test.describe('agent states', () => {
	test('the status line follows the phases of a run and the answer glows as it arrives', async ({
		page
	}) => {
		const server = await fakeServer(page);
		await page.goto('/it/agente');
		const question = "Che differenza c'è tra Relay e Portsage?";
		await ask(page, question);
		const { ws, submitted } = server();
		expect(await submitted).toBe(question);
		const status = page.locator('[data-agent-status]');

		// Before Jev answers, the message is already on screen.
		await expect(page.getByText(question)).toBeVisible();
		await expect(status).toContainText('jev valuta la domanda');

		ws.send(
			JSON.stringify({
				type: 'triage',
				text: question,
				triage: { intent: 'about', confidence: 0.97, weight: 'medium', lang: 'it', ms: 312 }
			})
		);
		events(
			ws,
			{
				type: 'entry_appended',
				entry: {
					id: 1,
					kind: 'pi.message',
					model: [{ role: 'user', content: [{ type: 'text', text: question }], timestamp: 0 }]
				}
			},
			{ type: 'run_start' }
		);
		await expect(status).toContainText('pensa');
		await expect(page.getByText(question)).toHaveCount(1);

		events(
			ws,
			{ type: 'message_start', message: assistant([]) },
			{
				type: 'message_update',
				changes: [
					{ type: 'thinking_start', contentIndex: 0, block: { type: 'thinking', thinking: 'hm' } }
				]
			}
		);
		await expect(status).toContainText('ragiona');

		events(ws, { type: 'tool_execution_start', toolCallId: 'c1', toolName: 'search_site' });
		await expect(status).toContainText('cerca tra progetti, scritti, metodo e adesso');
		await expect(status).toContainText(/\d,\d s/);

		events(
			ws,
			{ type: 'tool_execution_end', toolCallId: 'c1', toolName: 'search_site' },
			{
				type: 'message_update',
				changes: [
					{ type: 'text_start', contentIndex: 1, block: { type: 'text', text: '' } },
					{ type: 'text_delta', contentIndex: 1, delta: 'Fanno due lavori diversi.' }
				]
			}
		);
		await expect(status).toContainText('scrive');
		await expect(page.locator('.phosphor').first()).toBeAttached();

		const final = assistant([
			{ type: 'thinking', thinking: 'hm' },
			{ type: 'text', text: 'Fanno due lavori diversi.' }
		]);
		events(
			ws,
			{ type: 'message_end', entry: { id: 2, kind: 'pi.message', model: [final] } },
			{ type: 'run_end' }
		);
		await expect(status).toHaveCount(0);
		await expect(page.getByText('Fanno due lavori diversi.')).toBeVisible();
		await expect(page.locator('.phosphor')).toHaveCount(0);
	});

	test('a retry counts down and keeps the raw error in the details', async ({ page }) => {
		const server = await fakeServer(page);
		await page.goto('/it/agente');
		await ask(page, 'Come lavora Simone?');
		const { ws } = server();
		events(
			ws,
			{ type: 'run_start' },
			{
				type: 'auto_retry_start',
				attempt: 1,
				at: Date.now() + 9000,
				errorMessage: '502 upstream connect error'
			}
		);
		const status = page.locator('[data-agent-status]');
		await expect(status).toContainText('il modello non ha risposto, riprovo');
		await expect(status).toContainText(/tra \d s/);
		await page.getByText('dettagli').click();
		await expect(page.getByText('502 upstream connect error')).toBeVisible();
	});

	test('an error reads in the visitor language, with a retry and the raw text', async ({
		page
	}) => {
		const server = await fakeServer(page);
		await page.goto('/it/agente');
		await ask(page, 'Mostrami il codice di Portsage');
		const { ws } = server();
		events(
			ws,
			{
				type: 'entry_appended',
				entry: {
					id: 1,
					kind: 'pi.message',
					model: [
						{
							role: 'user',
							content: [{ type: 'text', text: 'Mostrami il codice di Portsage' }],
							timestamp: 0
						}
					]
				}
			},
			{ type: 'run_start' },
			{ type: 'run_end' },
			{
				type: 'submission',
				record: { status: 'unanswered', reason: 'provider_error' }
			}
		);
		const error = page.locator('[data-agent-error="provider"]');
		await expect(error).toContainText('Il modello non è disponibile in questo momento');
		await expect(error.getByRole('button', { name: 'riprova' })).toBeVisible();
		await error.getByText('dettagli').click();
		await expect(error.getByText('Not answered: provider_error')).toBeVisible();
	});

	test('a dropped connection says so, and says when it is back', async ({ page }) => {
		const server = await fakeServer(page);
		await page.goto('/en/agent');
		await expect(page.getByText(MODEL.modelId)).toBeVisible({ timeout: 15_000 });
		await server().ws.close();
		await expect(page.getByText('connection lost, reconnecting…')).toBeVisible();
		// The client reconnects by itself, and the fake server answers again.
		await expect(page.getByText('reconnected')).toBeVisible({ timeout: 15_000 });
		await expect(page.getByText(MODEL.modelId)).toBeVisible();
	});

	test('a conversation being resumed shows that it is loading', async ({ page }) => {
		// A server that never sends the transcript: the page stays on the loading line.
		await page.routeWebSocket(/\/agents\/site-agent\//, () => {});
		await page.goto('/en/agent');
		await page.evaluate(() => localStorage.setItem('agent-started', '1'));
		await page.reload();
		await expect(page.locator('[data-agent-status]')).toContainText('loading the conversation');
	});
});
