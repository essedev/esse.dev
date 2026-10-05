/**
 * Evaluation of Jev's triage on a hand-labeled set (`tests/eval/jev-triage.json`). It calls
 * Jev for real, via OpenRouter, with the same questions and thresholds as the agent
 * (`src/agent/triage.ts`), so it is not part of the test run: launch it by hand with
 * `pnpm eval:jev` after a build (it reads the site titles from
 * `dist/client/agent/index.json`).
 *
 * It measures: wrong decisions with the current thresholds (legitimate questions stopped,
 * off-topic and abuse let through), accuracy of intent and language, calibration by
 * probability band, the effect of different thresholds, latency. Cost: about 40,000 tokens
 * at $0.042 per million.
 */
import { readFileSync } from 'node:fs';
import {
	admits,
	BLOCK_ABUSE,
	BLOCK_OFF_TOPIC_MASS,
	jevInput,
	onTopic,
	parseTriage,
	type Intent,
	type JevOutput,
	type Triage
} from '../src/agent/triage.ts';

interface Case {
	text: string;
	intent: Intent;
	lang: 'it' | 'en';
	note?: string;
}

const ENDPOINT = 'https://openrouter.ai/api/v1/systemone';
const MODEL = 'typesafe/jev-1.13';

function apiKey(): string {
	if (process.env.OPENROUTER_API_KEY) return process.env.OPENROUTER_API_KEY;
	const vars = readFileSync('.dev.vars', 'utf8').match(/^OPENROUTER_API_KEY=(.+)$/m);
	if (!vars) throw new Error('OPENROUTER_API_KEY non trovata (env o .dev.vars)');
	return vars[1].trim();
}

const cases = JSON.parse(readFileSync('tests/eval/jev-triage.json', 'utf8')) as Case[];
const topics = [
	...new Set(
		(JSON.parse(readFileSync('dist/client/agent/index.json', 'utf8')) as { title: string }[]).map(
			(d) => d.title
		)
	)
];
const key = apiKey();

async function triage(text: string): Promise<Triage> {
	const started = Date.now();
	const res = await fetch(ENDPOINT, {
		method: 'POST',
		headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
		body: JSON.stringify({ model: MODEL, ...jevInput(text, topics) })
	});
	if (!res.ok) throw new Error(`Jev: HTTP ${res.status} ${await res.text()}`);
	return parseTriage((await res.json()) as JevOutput, Date.now() - started);
}

const shouldAdmit = (c: Case) => c.intent === 'about' || c.intent === 'code' || c.intent === 'chat';
const pct = (n: number, d: number) => `${n}/${d} (${d ? Math.round((n / d) * 100) : 0}%)`;

const results: { c: Case; t: Triage }[] = [];
for (const c of cases) {
	// In sequence: the measured latency is that of a single request.
	results.push({ c, t: await triage(c.text) });
}

const wrongBlocks = results.filter(({ c, t }) => shouldAdmit(c) && !admits(t));
const wrongAdmits = results.filter(({ c, t }) => !shouldAdmit(c) && admits(t));
// "about" and "code" both pass: confusing them does not change the decision.
const group = (i: Intent) => (i === 'about' || i === 'code' ? 'on-topic' : i);
const intentOk = results.filter(({ c, t }) => group(c.intent) === group(t.intent));
const langOk = results.filter(({ c, t }) => c.lang === t.lang);

console.log(
	`\nJev ${MODEL}, ${results.length} messaggi, soglie fuori tema ${BLOCK_OFF_TOPIC_MASS} (massa) abuso ${BLOCK_ABUSE}\n`
);
console.log(
	`Decisione giusta:        ${pct(results.length - wrongBlocks.length - wrongAdmits.length, results.length)}`
);
console.log(
	`Legittimi fermati:       ${pct(wrongBlocks.length, results.filter(({ c }) => shouldAdmit(c)).length)}`
);
console.log(
	`Da fermare passati:      ${pct(wrongAdmits.length, results.filter(({ c }) => !shouldAdmit(c)).length)}`
);
console.log(`Intento (in tema/chiacchiera/fuori/abuso): ${pct(intentOk.length, results.length)}`);
console.log(`Lingua:                  ${pct(langOk.length, results.length)}`);

for (const [label, list] of [
	['Legittimi fermati', wrongBlocks],
	['Da fermare passati', wrongAdmits]
] as const) {
	for (const { c, t } of list) {
		console.log(
			`  ${label}: "${c.text}" atteso ${c.intent}, Jev ${t.intent} ${JSON.stringify(t.probabilities)}`
		);
	}
}

// Calibration: among the answers given with a probability in a band, how many are right?
console.log(
	"\nCalibrazione (probabilità dell'intento scelto, gruppi in tema/chiacchiera/fuori/abuso):"
);
for (const [lo, hi] of [
	[0, 0.6],
	[0.6, 0.8],
	[0.8, 0.95],
	[0.95, 1.01]
]) {
	const bin = results.filter(({ t }) => t.confidence >= lo && t.confidence < hi);
	const ok = bin.filter(({ c, t }) => group(c.intent) === group(t.intent)).length;
	console.log(`  ${lo.toFixed(2)}-${Math.min(hi, 1).toFixed(2)}: ${pct(ok, bin.length)}`);
}

// Alternative thresholds on the off-topic mass, with abuse held at the current one.
console.log('\nSoglia fuori tema (massa): legittimi fermati / da fermare passati');
for (const threshold of [0.5, 0.55, 0.6, 0.65, 0.7, 0.75, 0.8, 0.85]) {
	const blocks = (t: Triage) =>
		(t.probabilities.abuse ?? 0) >= BLOCK_ABUSE || 1 - onTopic(t) >= threshold;
	const legit = results.filter(({ c }) => shouldAdmit(c));
	const bad = results.filter(({ c }) => !shouldAdmit(c));
	console.log(
		`  ${threshold.toFixed(2)}: ${legit.filter(({ t }) => blocks(t)).length}/${legit.length}  ${bad.filter(({ t }) => !blocks(t)).length}/${bad.length}`
	);
}

const ms = results.map(({ t }) => t.ms).sort((a, b) => a - b);
console.log(
	`\nLatenza: mediana ${ms[Math.floor(ms.length / 2)]} ms, p95 ${ms[Math.floor(ms.length * 0.95)]} ms\n`
);

console.log('Dettaglio:');
for (const { c, t } of results) {
	const mark = shouldAdmit(c) === admits(t) ? ' ' : 'x';
	console.log(
		`${mark} ${c.intent.padEnd(8)} -> ${t.intent.padEnd(8)} ${t.confidence.toFixed(2)} in tema ${onTopic(t).toFixed(2)} ${t.weight.padEnd(6)} ${t.lang} ${String(t.ms).padStart(4)}ms  ${c.text}`
	);
}
