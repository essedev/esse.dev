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
		// Alone: the empty state is not drawn above a conversation that is on its way.
		await expect(page.getByRole('heading', { name: 'Try asking' })).toHaveCount(0);
	});

	test('a message sent during an answer waits under it, marked as queued', async ({ page }) => {
		const server = await fakeServer(page);
		await page.goto('/en/agent');
		await ask(page, 'First question');
		const { ws } = server();
		const userEntry = (id: number, text: string) => ({
			type: 'entry_appended',
			entry: {
				id,
				kind: 'pi.message',
				model: [{ role: 'user', content: [{ type: 'text', text }], timestamp: 0 }]
			}
		});
		const triage = (text: string) =>
			ws.send(
				JSON.stringify({
					type: 'triage',
					text,
					triage: { intent: 'about', confidence: 0.9, weight: 'light', lang: 'en', ms: 200 }
				})
			);
		triage('First question');
		events(ws, userEntry(1, 'First question'), { type: 'run_start' });

		await page.locator('[data-agent-input]').fill('Second question');
		await page.locator('[data-agent-input]').press('Enter');
		triage('Second question');
		events(ws, { type: 'inbox_update', items: [{}] });

		const waiting = page.locator('[data-agent-pending]');
		await expect(waiting).toContainText('Second question');
		await expect(waiting).toContainText('queued, after this answer');
		// The status line is about the answer in progress: above the queued message.
		const status = await page.locator('[data-agent-status]').boundingBox();
		const queued = await waiting.boundingBox();
		expect(status!.y).toBeLessThan(queued!.y);

		// pi takes it: it leaves the queue and becomes part of the transcript.
		events(ws, { type: 'inbox_update', items: [] }, userEntry(2, 'Second question'));
		await expect(waiting).toHaveCount(0);
		await expect(page.getByText('Second question')).toHaveCount(1);
	});

	test('an agent that never answers says so', async ({ page }) => {
		await page.routeWebSocket(/\/agents\/site-agent\//, (ws) => ws.close());
		await page.goto('/en/agent');
		await expect(page.locator('[data-agent-status]')).toContainText(
			'the agent is not answering, retrying by itself'
		);
		await expect(page.locator('main ul button').first()).toBeDisabled();
	});

	test('a conversation that expires with the page open starts again empty', async ({ page }) => {
		let connections = 0;
		let first: WebSocketRoute | undefined;
		await page.routeWebSocket(/\/agents\/site-agent\//, (ws) => {
			connections += 1;
			if (connections === 1) first = ws;
			const entries =
				connections === 1
					? [
							{
								id: 1,
								kind: 'pi.message',
								model: [
									{ role: 'user', content: [{ type: 'text', text: 'Old question' }], timestamp: 0 }
								]
							},
							{
								id: 2,
								kind: 'pi.message',
								model: [assistant([{ type: 'text', text: 'Old answer' }])]
							}
						]
					: [];
			ws.send(JSON.stringify({ type: 'hello', tools: [{ name: 'search_site', description: '' }] }));
			ws.send(JSON.stringify({ type: 'events', events: [{ ...snapshot, entries }] }));
		});
		await page.goto('/en/agent');
		await expect(page.getByText('Old answer')).toBeVisible({ timeout: 15_000 });
		// The title leaves with an open conversation (it stays for screen readers).
		const workspace = page.locator('[data-workspace]');
		await expect(workspace).toHaveAttribute('data-agent-started');

		// The object empties itself and drops the socket; the client comes back to nothing.
		await first!.close();
		await expect(page.getByText('Old answer')).toHaveCount(0, { timeout: 15_000 });
		await expect(page.locator('main ul button')).toHaveCount(4);
		await expect(workspace).not.toHaveAttribute('data-agent-started');
	});
});

test.describe('agent before and without JavaScript', () => {
	test.use({ javaScriptEnabled: false });

	test('the field is in place, disabled, and a line says why', async ({ page }) => {
		await page.goto('/en/agent');
		const fallback = page.locator('[data-agent-fallback]');
		await expect(fallback.locator('textarea')).toBeDisabled();
		// Playwright's text matching skips what is inside <noscript>, like <script>: the line is
		// read from the DOM and its box measured.
		const line = fallback.locator('noscript p');
		expect(await line.evaluate((p) => p.textContent)).toContain('The agent needs JavaScript.');
		expect((await line.boundingBox())!.height).toBeGreaterThan(0);
	});
});
