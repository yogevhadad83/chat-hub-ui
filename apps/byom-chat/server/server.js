"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const http_1 = require("http");
const fs_1 = __importDefault(require("fs"));
const socket_io_1 = require("socket.io");
const http_proxy_middleware_1 = require("http-proxy-middleware");
const app = (0, express_1.default)();
const server = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(server);
const PORT = process.env.PORT || 3000;
// Resolve dist directory robustly (works locally and on Render)
const candidates = [
    path_1.default.join(__dirname, "../dist"),
    path_1.default.join(process.cwd(), "apps/byom-chat/dist"),
    path_1.default.join(process.cwd(), "dist"),
];
const distDir = candidates.find((p) => fs_1.default.existsSync(path_1.default.join(p, "index.html"))) || candidates[0];
console.log(`[byom-chat] Serving static files from: ${distDir}`);
app.use(express_1.default.static(distDir));
// Proxy API to SaaS backend (mirrors Vite dev proxy). Avoids the catch-all returning index.html with 200.
const saasTarget = process.env.SAAS_BASE_URL || process.env.VITE_SAAS_BASE_URL || "https://chat-hub-ybyy.onrender.com";
console.log(`[byom-chat] Proxying /api -> ${saasTarget}`);
app.use("/api", (0, http_proxy_middleware_1.createProxyMiddleware)({
    target: saasTarget,
    changeOrigin: true,
    pathRewrite: { "^/api": "" },
}));
app.get("*", (req, res) => {
    const indexPath = path_1.default.join(distDir, "index.html");
    if (!fs_1.default.existsSync(indexPath)) {
        res.status(500).send("Build missing: dist/index.html not found. Did the client build run?");
        return;
    }
    res.sendFile(indexPath);
});
const conversations = new Map();
io.on("connection", (socket) => {
    console.log("[socket] client connected", socket.id);
    socket.on("join", ({ conversationId, userId }) => {
        if (!conversationId || !userId)
            return;
        socket.join(conversationId);
        // Ensure conversation exists
        if (!conversations.has(conversationId)) {
            conversations.set(conversationId, []);
        }
        // Send history to the newly joined client
        const history = conversations.get(conversationId);
        socket.emit("history", history);
    });
    socket.on("message", (msg) => {
        var _a;
        const { conversationId, author, text, ts, meta } = msg || {};
        if (!conversationId || !author || typeof text !== "string" || typeof ts !== "number")
            return;
        const entry = { author, role: "user", text, ts, meta };
        const list = (_a = conversations.get(conversationId)) !== null && _a !== void 0 ? _a : [];
        list.push(entry);
        // Keep only the last 1000 messages per conversation
        conversations.set(conversationId, list.slice(-1000));
        io.to(conversationId).emit("message", entry);
    });
    socket.on("assistant", (msg) => {
        var _a;
        const { conversationId, text, ts, meta } = msg || {};
        if (!conversationId || typeof text !== "string" || typeof ts !== "number")
            return;
        const entry = { author: "assistant", role: "assistant", text, ts, meta };
        const list = (_a = conversations.get(conversationId)) !== null && _a !== void 0 ? _a : [];
        list.push(entry);
        conversations.set(conversationId, list.slice(-1000));
        io.to(conversationId).emit("assistant", entry);
    });
    socket.on("disconnect", (reason) => {
        console.log("[socket] client disconnected", socket.id, reason);
    });
});
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
