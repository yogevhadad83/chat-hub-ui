"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const app = (0, express_1.default)();
const server = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(server);
const PORT = process.env.PORT || 3000;
const distDir = path_1.default.join(__dirname, "../dist");
app.use(express_1.default.static(distDir));
app.get("*", (req, res) => {
    res.sendFile(path_1.default.join(distDir, "index.html"));
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
