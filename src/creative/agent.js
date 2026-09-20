import 'server-only';
import Anthropic from '@anthropic-ai/sdk';
import { anthropicTools, runTool, systemPrompt, applyOp } from './engine.js';
import { lookupCompany, companyLogoAsset, fundFacts } from './facts.js';
import { validateAsset } from './validate.js';

const MODEL = 'claude-sonnet-5';
const MAX_TURNS = 14;
// The route may run 60s. A model call can take ~20s, so a NEW call only starts
// while there's room; otherwise we return what's built (always valid) and the
// caller continues in another request.
const BUDGET_MS = 34_000;

const FACT_TOOLS = [
  { name: 'lookup_company', description: "Look up a Yali portfolio company in Sanity: its public description, sector, status, website, and whether Yali lists it publicly. Use for anything about a portfolio company.", input_schema: { type: 'object', properties: { query: { type: 'string', description: 'company name' } }, required: ['query'], additionalProperties: false } },
  { name: 'attach_company_logo', description: "Add a portfolio company's official logo to this asset's pictures. Returns the picture id to use in an image block.", input_schema: { type: 'object', properties: { company: { type: 'string', description: 'company name or slug' } }, required: ['company'], additionalProperties: false } },
  { name: 'get_fund_facts', description: 'Fund II terms from Sanity (size, term, investment period, allocation, sectors), each with the source string for a stat block.', input_schema: { type: 'object', properties: {}, additionalProperties: false } },
];
const FACT_NAMES = new Set(FACT_TOOLS.map((t) => t.name));

async function runFactTool(holder, name, input) {
  if (name === 'lookup_company') {
    const found = await lookupCompany(input.query);
    return found.length ? JSON.stringify(found, null, 1) : `No portfolio company matches "${input.query}". Do not guess: tell the person, or ask which company they mean.`;
  }
  if (name === 'attach_company_logo') {
    const logo = await companyLogoAsset(input.company);
    if (!logo) throw new Error(`No logo found for "${input.company}". Say so; do not use another company's logo.`);
    const { doc } = applyOp(holder.doc, 'add_asset', { id: logo.id, asset: logo.asset });
    holder.doc = doc;
    return `OK: ${logo.company}'s logo is attached as picture id "${logo.id}". Use { "kind":"upload", "id":"${logo.id}" } in an image block, fit "contain", on a light chip or light ground.`;
  }
  const f = await fundFacts();
  return f ? JSON.stringify(f, null, 1) : 'Fund II settings are not available.';
}

// Runs the composing loop on an asset. Every tool call goes through the
// engine, so an invalid move is rejected with its reason and the model fixes
// it within the loop; the returned asset is always valid.
export async function runCreativeAgent(doc, prompt, history = []) {
  const client = new Anthropic();
  const tools = [...anthropicTools(), ...FACT_TOOLS];
  tools[tools.length - 1].cache_control = { type: 'ephemeral' };
  const holder = { doc };
  const system = [{ type: 'text', text: systemPrompt(doc), cache_control: { type: 'ephemeral' } }];
  const messages = [
    ...history.slice(-6).map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: String(m.content).slice(0, 2000) })),
    { role: 'user', content: prompt },
  ];

  const t0 = Date.now();
  let reply = '';
  let calls = 0;
  let unfinished = false;
  const trace = []; // what each tool call did, so a surprising result can be explained
  for (let turn = 0; turn < MAX_TURNS; turn += 1) {
    if (turn > 0 && Date.now() - t0 > BUDGET_MS) {
      unfinished = true;
      break;
    }
    const res = await client.messages.create({ model: MODEL, max_tokens: 6000, system, tools, messages });
    messages.push({ role: 'assistant', content: res.content });
    reply = res.content.filter((b) => b.type === 'text').map((b) => b.text).join('\n').trim() || reply;
    if (res.stop_reason !== 'tool_use') break;
    if (turn === MAX_TURNS - 1) unfinished = true;
    const results = await Promise.all(
      res.content
        .filter((b) => b.type === 'tool_use')
        .map(async (b) => {
          calls += 1;
          try {
            const content = FACT_NAMES.has(b.name) ? await runFactTool(holder, b.name, b.input || {}) : runTool(holder, b.name, b.input);
            trace.push({ tool: b.name, ok: true, note: String(content).split('\n')[0].slice(0, 160) });
            return { type: 'tool_result', tool_use_id: b.id, content: String(content) };
          } catch (err) {
            trace.push({ tool: b.name, ok: false, note: err.message.replace(/\n\(Nothing was changed\.\)/, '').slice(0, 400) });
            return { type: 'tool_result', tool_use_id: b.id, content: err.message, is_error: true };
          }
        })
    );
    messages.push({ role: 'user', content: results });
  }
  if (!reply.trim()) reply = unfinished ? 'Still building.' : trace.some((t) => t.ok) ? 'Done. Check the preview, and tell me what to change.' : 'I could not build that. See the steps below for why.';
  return { doc: holder.doc, reply, calls, unfinished, trace, validation: validateAsset(holder.doc) };
}
