import Anthropic from '@anthropic-ai/sdk';

export const maxDuration = 60;

const SANITY_PROJECT_ID = 'nt0wmty3';
const SANITY_DATASET = 'production';
const SANITY_API_VERSION = '2024-01-01';

export async function GET(request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Fetch all subscribers
  const query = encodeURIComponent('*[_type=="newsletterSubscriber" && unsubscribed != true]{_id,email,source}');
  const sanityUrl = `https://${SANITY_PROJECT_ID}.api.sanity.io/v${SANITY_API_VERSION}/data/query/${SANITY_DATASET}?query=${query}`;

  const subscriberRes = await fetch(sanityUrl, {
    headers: { Authorization: `Bearer ${process.env.SANITY_WRITE_TOKEN}` },
  });
  const { result: subscribers } = await subscriberRes.json();

  if (!subscribers || subscribers.length === 0) {
    return Response.json({ deleted: 0, message: 'No subscribers found' });
  }

  // Ask Claude to classify the full list in one shot
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const emailList = subscribers
    .map((s) => `${s._id} | ${s.email} | src:${s.source || 'unknown'}`)
    .join('\n');

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `You are helping clean up a newsletter subscriber list. Below is a list of email addresses with their Sanity document IDs. Identify which ones are clearly fake, test, spam, or bot-generated — things like test@test.com, email@email.com, all-number addresses, gibberish strings, duplicate entries (same email appearing more than once — keep only the FIRST occurrence and mark the rest for deletion), or addresses from known cold-email/spam tool domains.

Be conservative: if an email looks like a real person's address, even if unusual, do NOT include it. Only flag the obvious junk.

Return ONLY a valid JSON object with this shape:
{"delete": ["id1", "id2", ...], "reason": "brief explanation"}

Subscriber list:
${emailList}`,
      },
    ],
  });

  let toDelete = [];
  let reason = '';
  try {
    const parsed = JSON.parse(message.content[0].text);
    toDelete = parsed.delete || [];
    reason = parsed.reason || '';
  } catch {
    return Response.json({ error: 'Failed to parse Claude response', raw: message.content[0].text }, { status: 500 });
  }

  if (toDelete.length === 0) {
    return Response.json({ deleted: 0, reason });
  }

  // Delete via Sanity mutations
  const mutations = toDelete.map((id) => ({ delete: { id } }));
  const mutationRes = await fetch(
    `https://${SANITY_PROJECT_ID}.api.sanity.io/v${SANITY_API_VERSION}/data/mutate/${SANITY_DATASET}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.SANITY_WRITE_TOKEN}`,
      },
      body: JSON.stringify({ mutations }),
    }
  );

  if (!mutationRes.ok) {
    const err = await mutationRes.text();
    return Response.json({ error: 'Sanity mutation failed', details: err }, { status: 500 });
  }

  const deletedEmails = subscribers
    .filter((s) => toDelete.includes(s._id))
    .map((s) => s.email);

  return Response.json({
    deleted: toDelete.length,
    emails: deletedEmails,
    reason,
  });
}
