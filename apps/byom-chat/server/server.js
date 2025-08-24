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
app.get("*", (req, res) => {
    const indexPath = path_1.default.join(distDir, "index.html");
    if (!fs_1.default.existsSync(indexPath)) {
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
