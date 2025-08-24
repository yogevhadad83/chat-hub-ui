import express from "express";
import path from "path";
import { createServer } from "http";
import fs from "fs";
import { Server } from "socket.io";
import { createProxyMiddleware } from "http-proxy-middleware";

const app = express();
const server = createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

// Resolve dist directory robustly (works locally and on Render)
const candidates = [
  path.join(__dirname, "../dist"),
  path.join(process.cwd(), "apps/byom-chat/dist"),
  path.join(process.cwd(), "dist"),
];
const distDir = candidates.find((p) => fs.existsSync(path.join(p, "index.html"))) || candidates[0];
console.log(`[byom-chat] Serving static files from: ${distDir}`);

app.use(express.static(distDir));

// Proxy API to SaaS backend (mirrors Vite dev proxy). Avoids the catch-all returning index.html with 200.
const saasTarget = process.env.SAAS_BASE_URL || process.env.VITE_SAAS_BASE_URL || "https://chat-hub-ybyy.onrender.com";
console.log(`[byom-chat] Proxying /api -> ${saasTarget}`);
app.use(
  "/api",
  createProxyMiddleware(
    {
      target: saasTarget,
      changeOrigin: true,
      pathRewrite: { "^/api": "" },
    } as any
  )
);

app.get("*", (req, res) => {
  const indexPath = path.join(distDir, "index.html");
  if (!fs.existsSync(indexPath)) {
    res.status(500).send("Build missing: dist/index.html not found. Did the client build run?");
    return;
  }
  res.sendFile(indexPath);
});

// In-memory conversation store (simple demo-grade persistence)
type StoredMessage = {
  author: string;
  role: "user" | "assistant";
  text: string;
  ts: number;
  meta?: { modelId?: string; sentToAI?: boolean };
  ephemeral?: boolean;
};

const conversations = new Map<string, StoredMessage[]>();

io.on("connection", (socket) => {
  console.log("[socket] client connected", socket.id);

  socket.on("join", ({ conversationId, userId }: { conversationId: string; userId: string }) => {
    if (!conversationId || !userId) return;
    socket.join(conversationId);

    // Ensure conversation exists
    if (!conversations.has(conversationId)) {
      conversations.set(conversationId, []);
    }

    // Send history to the newly joined client
    const history = conversations.get(conversationId)!;
    socket.emit("history", history);
  });

  socket.on(
    "message",
    (msg: { conversationId: string; author: string; text: string; ts: number; meta?: StoredMessage["meta"] }) => {
      const { conversationId, author, text, ts, meta } = msg || ({} as any);
      if (!conversationId || !author || typeof text !== "string" || typeof ts !== "number") return;

      const entry: StoredMessage = { author, role: "user", text, ts, meta };
      const list = conversations.get(conversationId) ?? [];
      list.push(entry);
      // Keep only the last 1000 messages per conversation
      conversations.set(conversationId, list.slice(-1000));

      io.to(conversationId).emit("message", entry);
    }
  );

  socket.on(
    "assistant",
    (msg: { conversationId: string; text: string; ts: number; meta?: StoredMessage["meta"] }) => {
      const { conversationId, text, ts, meta } = msg || ({} as any);
      if (!conversationId || typeof text !== "string" || typeof ts !== "number") return;

      const entry: StoredMessage = { author: "assistant", role: "assistant", text, ts, meta };
      const list = conversations.get(conversationId) ?? [];
      list.push(entry);
      conversations.set(conversationId, list.slice(-1000));

      io.to(conversationId).emit("assistant", entry);
    }
  );

  socket.on("disconnect", (reason) => {
    console.log("[socket] client disconnected", socket.id, reason);
  });
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
