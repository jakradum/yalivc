// Generates tests/parity/expected/<function>.json by running the ORIGINAL GROQ (queries.mjs)
// with groq-js over the fixtures, adjusted to hosted-API behaviour (engine.mjs).
// Usage: node tests/parity/gen-expected.mjs
import { readFileSync, writeFileSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { FUNCTIONS } from './queries.mjs';
import { makeFetch } from './engine.mjs';
import { inputsFor, sampleForScenario } from './inputs.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
export const SCENARIOS = ['main', 'empty', 'alt', 'perf-throws', 'perf-single', 'fund-lp-internal', 'fund-lp-legacy'];
const PARAM_SCENARIOS = ['main', 'empty', 'alt'];
const loadScenario = (s) => JSON.parse(readFileSync(path.join(here, 'fixtures', `${s}.json`), 'utf8'));

const outDir = path.join(here, 'expected');
mkdirSync(outDir, { recursive: true });
for (const f of readdirSync(outDir)) if (f.endsWith('.json')) rmSync(path.join(outDir, f));

const data = Object.fromEntries(SCENARIOS.map((s) => [s, loadScenario(s)]));
const fetchers = Object.fromEntries(SCENARIOS.map((s) => [s, makeFetch(data[s])]));
let total = 0;
for (const [name, spec] of Object.entries(FUNCTIONS)) {
  const cases = [];
  const probe = inputsFor(name, spec, data.main, 'main');
  const hasParams = !(probe.length === 1 && probe[0].length === 0);
  for (const scenario of hasParams ? PARAM_SCENARIOS : SCENARIOS) {
    const inputs = sampleForScenario(inputsFor(name, spec, data[scenario], scenario), scenario);
    for (const input of inputs) {
      try {
        const output = await spec.run(fetchers[scenario], ...input);
        cases.push({ scenario, input, output: output === undefined ? null : output });
      } catch (e) {
        cases.push({ scenario, input, throws: e.constructor?.name || 'Error', message: String(e.message).slice(0, 200) });
      }
    }
  }
  writeFileSync(path.join(outDir, `${name}.json`), JSON.stringify(cases, null, 1) + '\n');
  total += cases.length;
  console.log(`${name}: ${cases.length} cases${cases.some((c) => c.throws) ? ` (${cases.filter((c) => c.throws).length} throw)` : ''}`);
}
console.log(`total ${total} cases`);
