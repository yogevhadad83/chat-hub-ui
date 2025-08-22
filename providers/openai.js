import fetch from 'node-fetch';

export function openaiProvider(cfg) {
  return {
    async invoke({ prompt }) {
      const resp = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${cfg.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: cfg.model || 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'You are a concise assistant.' },
            { role: 'user', content: prompt }
          ]
        })
      });
      if (!resp.ok) throw new Error(`OpenAI ${resp.status}`);
      const data = await resp.json();
      return data.choices?.[0]?.message?.content?.trim() || '';
    }
  };
}