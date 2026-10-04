/**
 * Valutazione del triage di Jev su un set etichettato a mano (`tests/eval/jev-triage.json`).
 * Chiama Jev davvero, via OpenRouter, con le stesse domande e le stesse soglie dell'agente
 * (`src/agent/triage.ts`), quindi non sta nel giro dei test: si lancia a mano con
 * `pnpm eval:jev` dopo una build (legge i titoli del sito da `dist/client/agent/index.json`).
 *
 * Misura: decisioni sbagliate con le soglie attuali (domande legittime fermate, fuori tema
 * e abusi passati), accuratezza di intento e lingua, calibrazione per fasce di probabilità,
 * l'effetto di soglie diverse, latenza. Costo: circa 40.000 token a 0,042 $ per milione.
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
	// In sequenza: la latenza misurata è quella di una richiesta sola.
	results.push({ c, t: await triage(c.text) });
}

const wrongBlocks = results.filter(({ c, t }) => shouldAdmit(c) && !admits(t));
const wrongAdmits = results.filter(({ c, t }) => !shouldAdmit(c) && admits(t));
// "about" e "code" passano entrambi: confonderli non cambia la decisione.
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

// Calibrazione: tra le risposte date con probabilità in una fascia, quante sono giuste?
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

// Soglie alternative sulla massa fuori tema, con l'abuso fermo a quella attuale.
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
