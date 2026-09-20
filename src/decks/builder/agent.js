import 'server-only';
import Anthropic from '@anthropic-ai/sdk';
import { anthropicTools, runTool } from './engine';
import { getDefinition } from './catalog';

const MODEL = 'claude-sonnet-5';
const MAX_TURNS = 10;

function systemPrompt(ctx) {
  const slides = ctx.entries
    .map((e, i) => `${i + 1}. ${e.id} (${getDefinition(ctx.deckId, e.ref)?.type})`)
    .join('\n');
  return `You edit the Yali Capital Fund II investor deck through a fixed set of tools. You cannot do anything else.

What you CAN do: reorder slides, remove slides, re-add removed slides, create new section dividers, and change text/number props of existing slides (titles, headings, subtitles, labels, list entries that already have that shape).

What you CANNOT do — say so plainly and do nothing for these:
- change layouts, colours, fonts or design, or create any slide type other than a section divider (that needs a developer);
- change the underlying facts — people, photos, portfolio companies, financials, logos. Those live in the CMS and flow in automatically;
- edit image or link fields.

Rules:
- Call list_slides first if you need current ids or positions. Slide ids are stable; positions shift as you edit.
- Use get_slide_props before rewriting a slide's text so you keep its existing shape.
- Make exactly the change asked for. Don't "improve" other slides.
- All changes are saved as a draft the user previews and publishes themselves, so you never publish.
- After editing, reply in one or two plain sentences saying what changed. If a tool errors, fix the input and retry, or explain what's not possible.

Current deck (${ctx.entries.length} slides):
${slides}`;
}

// history: [{ role: 'user'|'assistant', content: string }] — prior turns
// from the builder UI, so "undo that" / "make it shorter" have context.
export async function runEditAgent(ctx, prompt, history = []) {
  const client = new Anthropic();
  const tools = anthropicTools();
  // Cache the (static) tool list + system prompt across turns of this loop.
  tools[tools.length - 1].cache_control = { type: 'ephemeral' };
  const system = [{ type: 'text', text: systemPrompt(ctx), cache_control: { type: 'ephemeral' } }];

  const messages = [
    ...history.slice(-6).map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: String(m.content).slice(0, 2000) })),
    { role: 'user', content: prompt },
  ];

  let reply = '';
  for (let turn = 0; turn < MAX_TURNS; turn++) {
    const res = await client.messages.create({ model: MODEL, max_tokens: 2048, system, tools, messages });
    messages.push({ role: 'assistant', content: res.content });
    reply = res.content.filter((b) => b.type === 'text').map((b) => b.text).join('\n').trim() || reply;
    if (res.stop_reason !== 'tool_use') break;

    const results = res.content
      .filter((b) => b.type === 'tool_use')
      .map((b) => {
        try {
          return { type: 'tool_result', tool_use_id: b.id, content: runTool(ctx, b.name, b.input) };
        } catch (err) {
          return { type: 'tool_result', tool_use_id: b.id, content: err.message, is_error: true };
        }
      });
    messages.push({ role: 'user', content: results });
  }
  return reply;
}
