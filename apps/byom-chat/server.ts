import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';

interface ChatMessage {
  author: string;
  role: 'user' | 'assistant';
  text: string;
  ts: number;
  meta?: { modelId?: string };
}

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: true },
});

const distPath = __dirname;
app.use(express.static(distPath));
app.get('*', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

const conversations: Record<string, ChatMessage[]> = {};

io.on('connection', (socket) => {
  socket.on('join', ({ conversationId, userId }) => {
    socket.join(conversationId);
    const history = conversations[conversationId] || [];
    socket.emit('history', history);
  });

  socket.on('message', ({ conversationId, author, text, ts }) => {
    const msg: ChatMessage = { author, role: 'user', text, ts };
    const arr = conversations[conversationId] || [];
    arr.push(msg);
    conversations[conversationId] = arr.slice(-500);
    io.to(conversationId).emit('message', msg);
  });

  socket.on('assistant', ({ conversationId, author, text, ts, meta }) => {
    const msg: ChatMessage = { author, role: 'assistant', text, ts, meta };
    const arr = conversations[conversationId] || [];
    arr.push(msg);
    conversations[conversationId] = arr.slice(-500);
    io.to(conversationId).emit('assistant', msg);
  });
});

const PORT = Number(process.env.PORT) || 4173;
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`server listening on ${PORT}`);
});
