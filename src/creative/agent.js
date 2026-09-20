import 'server-only';
import Anthropic from '@anthropic-ai/sdk';
import { anthropicTools, runTool, systemPrompt } from './engine.js';
import { validateAsset } from './validate.js';

const MODEL = 'claude-sonnet-5';
const MAX_TURNS = 14;
// The route may run 60s. A model call can take ~20s, so a NEW call only starts
// while there's room; otherwise we return what's built (always valid) and the
// caller continues in another request.
const BUDGET_MS = 34_000;

// Runs the composing loop on an asset. Every tool call goes through the
// engine, so an invalid move is rejected with its reason and the model fixes
// it within the loop; the returned asset is always valid.
export async function runCreativeAgent(doc, prompt, history = []) {
  const client = new Anthropic();
  const tools = anthropicTools();
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
    const results = res.content
      .filter((b) => b.type === 'tool_use')
      .map((b) => {
        calls += 1;
        try {
          return { type: 'tool_result', tool_use_id: b.id, content: runTool(holder, b.name, b.input) };
        } catch (err) {
          return { type: 'tool_result', tool_use_id: b.id, content: err.message, is_error: true };
        }
      });
    messages.push({ role: 'user', content: results });
  }
  return { doc: holder.doc, reply, calls, unfinished, validation: validateAsset(holder.doc) };
}
