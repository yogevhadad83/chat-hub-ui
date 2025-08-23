import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import crypto from 'node:crypto';

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const http = createServer(app);
const io = new Server(http, { cors: { origin: '*' } });

const conversations = new Map();     // conversationId -> { id, messages[] }

io.on('connection', (socket) => {
  socket.on('join', (conversationId) => socket.join(conversationId));
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

const port = process.env.PORT || 3001;
http.listen(port, () => console.log('server on :' + port));