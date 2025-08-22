import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { summarize } from './summarizer.js';
import { openaiProvider } from './providers/openai.js';
import crypto from 'node:crypto';

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const http = createServer(app);
const io = new Server(http, { cors: { origin: '*' } });

const conversations = new Map();     // conversationId -> { id, messages[] }
const userProviders = new Map();     // userId -> { type:'openai', apiKey, model }

io.on('connection', (socket) => {
  socket.on('join', (conversationId) => socket.join(conversationId));
});

app.post('/register-provider', (req, res) => {
  const { userId, provider, config } = req.body || {};
  if (!userId || provider !== 'openai' || !config?.apiKey)
    return res.status(400).json({ error: 'userId, provider=openai, config.apiKey required' });
  userProviders.set(userId, { type: 'openai', apiKey: config.apiKey, model: config.model || 'gpt-4o-mini' });
  res.json({ ok: true });
});

app.post('/message', (req, res) => {
  const { conversationId, author, text } = req.body || {};
  if (!conversationId || !author || !text) return res.status(400).json({ error: 'missing fields' });
  const convo = conversations.get(conversationId) || { id: conversationId, messages: [] };
  const msg = { id: crypto.randomUUID(), author, role: 'user', text, ts: Date.now() };
  convo.messages.push(msg);
  conversations.set(conversationId, convo);
  io.to(conversationId).emit('message', msg);
  res.json({ ok: true, id: msg.id });
});

app.post('/invoke', async (req, res) => {
  try {
    const { conversationId, userId } = req.body || {};
    const convo = conversations.get(conversationId);
    if (!convo) return res.status(404).json({ error: 'conversation not found' });
    const cfg = userProviders.get(userId);
    if (!cfg) return res.status(400).json({ error: 'no provider registered for user' });

    const summary = await summarize(convo.messages);
    const latest = convo.messages.at(-1)?.text || '';
    const prompt = `Conversation summary:\n${summary}\n\nLatest user message:\n${latest}\n\nRespond as ${userId}'s assistant. Be concise.`;

    const provider = openaiProvider(cfg);
    const text = await provider.invoke({ prompt });

    const msg = { id: crypto.randomUUID(), author: userId, role: 'assistant', text, ts: Date.now() };
    convo.messages.push(msg);
    io.to(conversationId).emit('message', msg);
    res.json({ ok: true, message: msg });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

const port = process.env.PORT || 3001;
http.listen(port, () => console.log('server on :' + port));