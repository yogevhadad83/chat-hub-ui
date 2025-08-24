import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { networkInterfaces } from 'os';
import { createProxyMiddleware } from 'http-proxy-middleware';

interface ChatMessage {
  author: string;
  role: 'user' | 'assistant';
  text: string;
  ts: number;
  meta?: { modelId?: string; sentToAI?: boolean };
}

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: true },
});

// Proxy BYOM SaaS API to avoid CORS in local/preview environments.
// All requests to /api/* will be forwarded to SAAS_BASE_URL (default Render URL).
const SAAS_BASE_URL =
  process.env.SAAS_BASE_URL || 'https://chat-hub-ybyy.onrender.com';
app.use(
  '/api',
  createProxyMiddleware({
    target: SAAS_BASE_URL,
    changeOrigin: true,
    xfwd: true,
    pathRewrite: { '^/api': '' },
  })
);

const distPath = __dirname;
app.use(express.static(distPath));
app.get('*', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

const conversations: Record<string, ChatMessage[]> = {};

io.on('connection', (socket) => {
  socket.on('join', ({ conversationId, userId: _userId }) => {
    socket.join(conversationId);
    const history = conversations[conversationId] || [];
    socket.emit('history', history);
  });

  socket.on('message', ({ conversationId, author, text, ts, meta }) => {
    const msg: ChatMessage = { author, role: 'user', text, ts, meta };
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
const HOST = process.env.HOST || '0.0.0.0';
httpServer.listen(PORT, HOST, () => {
  const localUrl = `http://localhost:${PORT}`;
  const nets = networkInterfaces();
  const lan = Object.values(nets)
    .flat()
    .find((i) => i && i.family === 'IPv4' && !i.internal)?.address;
  const lanUrl = lan ? `http://${lan}:${PORT}` : null;
  console.log('');
  console.log('Server running:');
  console.log(`  Local:   ${localUrl}`);
  if (lanUrl) console.log(`  Network: ${lanUrl}`);
});
