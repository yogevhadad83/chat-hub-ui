import path from 'node:path';
import express from 'express';
import { createServer } from 'node:http';
import { Server as IOServer } from 'socket.io';

type Msg = { author: string; role: 'user'|'assistant'; text: string; ts: number };

const app = express();
const httpServer = createServer(app);
const io = new IOServer(httpServer, { cors: { origin: '*' } });

const conversations = new Map<string, Msg[]>();
const PORT = Number(process.env.PORT) || 4173;
const DIST_DIR = __dirname; // server.cjs is emitted into dist/, serve same folder

io.on('connection', (socket) => {
  socket.on('join', ({ conversationId, userId }) => {
    socket.join(conversationId);
    const history = conversations.get(conversationId) ?? [];
    socket.emit('history', history);
  });

  socket.on('message', ({ conversationId, author, text, ts }) => {
    const msg: Msg = { author, role: 'user', text, ts: ts ?? Date.now() };
    const list = conversations.get(conversationId) ?? [];
    list.push(msg);
    if (list.length > 500) list.splice(0, list.length - 500);
    conversations.set(conversationId, list);
    io.to(conversationId).emit('message', msg);
  });

  socket.on('assistant', ({ conversationId, text, ts, meta }) => {
    const msg: Msg = { author: 'assistant', role: 'assistant', text, ts: ts ?? Date.now() };
    const list = conversations.get(conversationId) ?? [];
    list.push(msg);
    if (list.length > 500) list.splice(0, list.length - 500);
    conversations.set(conversationId, list);
    io.to(conversationId).emit('assistant', { ...msg, meta });
  });
});

app.use(express.static(DIST_DIR));
app.get('*', (_req, res) => {
  res.sendFile(path.join(DIST_DIR, 'index.html'));
});

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`byom-chat listening on :${PORT}`);
});
