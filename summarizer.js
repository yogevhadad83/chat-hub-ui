import fetch from 'node-fetch';

const SUM_MODEL = process.env.SUM_MODEL || 'gpt-4o-mini';
const SUM_KEY = process.env.OPENAI_API_KEY;

export async function summarize(messages) {
  const last = messages.slice(-12).map(m => `${m.author}: ${m.text}`).join('\n');
  const prompt = `Summarize the chat below into 5 short bullets. Keep only facts/decisions.\n\n${last}`;
  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${SUM_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: SUM_MODEL, messages: [{ role: 'user', content: prompt }] })
  });
  if (!resp.ok) return '';
  const data = await resp.json();
  return data.choices?.[0]?.message?.content?.trim() || '';
}