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

What you CAN do: reorder slides, hide or show slides (hidden slides stay in the list but are left out of the preview and PDF), remove slides, re-add removed slides, create new section dividers, and change any text or number shown on a slide — titles, headings, subtitles, labels, and list entries such as the portfolio appendix's company cards (name, sector, description, and their metrics like Invested / FMV / MOIC / Ownership / Stage). For one item in a list use edit_list_item; it keeps the rest of the item (and its logo) intact.

Every text edit is a DECK-ONLY override: the CMS and the LP reports are not touched. So when you change a financial figure or a fact (an amount, FMV, MOIC, ownership, a date), still do it if asked, but say in your reply that the deck now differs from the CMS. Never invent figures: if the user gives no value, ask.

What you CANNOT do — say so plainly and do nothing for these:
- change layouts, colours, fonts or design, or create any slide type other than a section divider (that needs a developer);
- add new people or new portfolio companies, or change photos and logos;
- edit image or link fields.

Rules:
- Call list_slides first if you need current ids or positions. Slide ids are stable; positions shift as you edit.
- Use get_slide_props before rewriting a slide's text so you keep its existing shape.\n- Slides are separate: the portfolio appendix is split across two slides (appendix-portfolio, appendix-portfolio-2); check list_slides/get_slide_props to find which one holds a company.
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
