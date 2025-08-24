import express from "express";
import path from "path";
import { createServer } from "http";
import fs from "fs";
import { Server } from "socket.io";

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

app.get("*", (req, res) => {
  const indexPath = path.join(distDir, "index.html");
  if (!fs.existsSync(indexPath)) {
    res.status(500).send("Build missing: dist/index.html not found. Did the client build run?");
    return;
  }
  res.sendFile(indexPath);
});

io.on("connection", (socket) => {
  console.log("a user connected");
  socket.on("message", (msg) => {
    io.emit("message", msg);
  });
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
